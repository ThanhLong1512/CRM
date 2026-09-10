"use server";

import { revalidatePath } from "next/cache";
import { ApprovalStatus, ApprovalTargetType, Prisma } from "@prisma/client";
import { getSessionDbUser, requireRoles } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { CreditOverrideRequest } from "@/types";
import { createApprovalRequest } from "@/lib/approval/approvalEngine";

export type CreditOverrideActionResult = {
  success: boolean;
  message: string;
  error?: string;
};

function fail(message: string): CreditOverrideActionResult {
  return { success: false, message, error: message };
}

function ok(message: string): CreditOverrideActionResult {
  return { success: true, message };
}

function revalidateCreditPaths() {
  revalidatePath("/khach-hang");
  revalidatePath("/dashboard");
  revalidatePath("/don-hang");
  revalidatePath("/sales");
}

export async function listCreditOverrideRequestsAction(): Promise<CreditOverrideRequest[]> {
  try {
    const requests = await prisma.approvalRequest.findMany({
      where: {
        targetType: ApprovalTargetType.ORDER_CREDIT_OVERRIDE,
      },
      include: {
        requester: { select: { name: true } },
        actionUser: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return requests.map((r): CreditOverrideRequest => {
      const meta = (r.metadata as Record<string, any>) || {};
      return {
        id: r.id,
        customerId: r.targetId,
        customerName: meta.customerName || r.title,
        requestedBy: r.requester?.name || "Sales thị trường",
        currentDebt: Number(meta.currentDebt ?? 0),
        creditLimit: Number(meta.creditLimit ?? 0),
        overdueDays: Number(meta.overdueDays ?? 0),
        reason: r.summary || meta.reason || "",
        requestedAmount: Number(r.amount ?? meta.requestedAmount ?? 0),
        requestedAt: new Date(r.createdAt).toLocaleTimeString("vi-VN", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        status: (r.status as "PENDING" | "APPROVED" | "REJECTED") || "PENDING",
        reviewedBy: r.actionUser?.name ?? undefined,
        reviewedAt: r.actionAt ? new Date(r.actionAt).toISOString() : undefined,
        rejectReason: r.decisionReason ?? undefined,
      };
    });
  } catch (error) {
    console.error("[listCreditOverrideRequestsAction error]:", error);
    return [];
  }
}

export async function requestCustomerCreditOverrideAction(input: {
  customerId: string;
  reason: string;
  amount: number;
}): Promise<CreditOverrideActionResult> {
  const customerId = String(input.customerId ?? "").trim();
  const reason = String(input.reason ?? "").trim();
  const amount = Number(input.amount || 0);

  if (!customerId) return fail("Vui lòng chỉ định khách hàng.");
  if (!reason) return fail("Vui lòng nhập lý do đề xuất cấp nợ vượt trần.");

  try {
    const dbUser = await requireRoles(["ADMIN", "SALES", "ACCOUNTANT"]);
    const actorId = dbUser.id;

    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      select: {
        id: true,
        name: true,
        currentDebt: true,
        creditLimit: true,
      },
    });

    if (!customer) return fail("Không tìm thấy khách hàng trong cơ sở dữ liệu.");

    await createApprovalRequest({
      targetType: ApprovalTargetType.ORDER_CREDIT_OVERRIDE,
      targetId: customer.id,
      targetCode: `KH-${customer.id.slice(-6).toUpperCase()}`,
      title: `Cấp nợ vượt trần: ${customer.name}`,
      summary: reason,
      amount,
      metadata: {
        customerId: customer.id,
        customerName: customer.name,
        currentDebt: Number(customer.currentDebt),
        creditLimit: Number(customer.creditLimit),
        requestedAmount: amount,
        reason,
      },
      requiredRole: "ADMIN",
      requesterId: actorId,
    });

    revalidateCreditPaths();
    return ok("Đã gửi yêu cầu cấp nợ vượt trần tới Ban Giám Đốc (đã lưu DB).");
  } catch (error) {
    console.error("[requestCustomerCreditOverrideAction error]:", error);
    return fail(
      error instanceof Error
        ? error.message
        : "Lỗi hệ thống khi gửi yêu cầu phê duyệt nợ.",
    );
  }
}

export async function decideCustomerCreditOverrideAction(input: {
  customerId: string;
  approved: boolean;
  reason?: string;
}): Promise<CreditOverrideActionResult> {
  const customerId = String(input.customerId ?? "").trim();
  const approved = Boolean(input.approved);
  const rejectReason = input.reason ? String(input.reason).trim() : null;

  if (!customerId) return fail("Vui lòng chỉ định khách hàng.");

  try {
    const dbUser = await requireRoles(["ADMIN"]);
    const actorId = dbUser.id;

    // Tìm yêu cầu đang PENDING của khách hàng
    const pendingReq = await prisma.approvalRequest.findFirst({
      where: {
        targetType: ApprovalTargetType.ORDER_CREDIT_OVERRIDE,
        targetId: customerId,
        status: ApprovalStatus.PENDING,
      },
      orderBy: { createdAt: "desc" },
    });

    if (!pendingReq) {
      return fail("Không tìm thấy yêu cầu vượt trần đang chờ duyệt của khách hàng này.");
    }

    const newStatus = approved ? ApprovalStatus.APPROVED : ApprovalStatus.REJECTED;

    await prisma.approvalRequest.update({
      where: { id: pendingReq.id },
      data: {
        status: newStatus,
        actionBy: actorId,
        decisionReason: rejectReason,
        actionAt: new Date(),
      },
    });

    revalidateCreditPaths();
    return ok(
      approved
        ? "Ban Giám Đốc đã phê duyệt vượt trần công nợ (lưu DB thành công)."
        : "Đã từ chối cấp nợ vượt trần (lưu DB thành công).",
    );
  } catch (error) {
    console.error("[decideCustomerCreditOverrideAction error]:", error);
    return fail(
      error instanceof Error
        ? error.message
        : "Lỗi hệ thống khi xử lý quyết định phê duyệt nợ.",
    );
  }
}
