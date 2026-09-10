import { prisma } from "@/lib/prisma";
import { ApprovalStatus, ApprovalTargetType, Prisma } from "@prisma/client";
import { approveDebtPayment, cancelDebtPayment } from "@/app/(private)/khach-hang/debt-actions";
import { formatMoney, formatVND } from "@/lib/formatMoney";

export type ApprovalRequestItem = {
  id: string;
  targetType: ApprovalTargetType;
  targetId: string;
  targetCode: string;
  title: string;
  summary: string | null;
  amount: number | null;
  metadata: any;
  requiredRole: string;
  requesterId: string;
  requesterName: string;
  status: ApprovalStatus;
  decisionReason: string | null;
  actionBy: string | null;
  actionUserName?: string;
  actionAt: string | null;
  createdAt: string;
};

/**
 * Đăng ký một yêu cầu phê duyệt mới vào hệ thống tập trung
 */
export async function createApprovalRequest(input: {
  targetType: ApprovalTargetType;
  targetId: string;
  targetCode: string;
  title: string;
  summary?: string;
  amount?: number;
  metadata?: any;
  requiredRole?: "ADMIN" | "ACCOUNTANT" | "DIRECTOR";
  requesterId: string;
}) {
  try {
    const existing = await prisma.approvalRequest.findFirst({
      where: {
        targetType: input.targetType,
        targetId: input.targetId,
        status: ApprovalStatus.PENDING,
      },
    });

    if (existing) {
      return existing;
    }

    return await prisma.approvalRequest.create({
      data: {
        targetType: input.targetType,
        targetId: input.targetId,
        targetCode: input.targetCode,
        title: input.title,
        summary: input.summary ?? null,
        amount: input.amount ? new Prisma.Decimal(input.amount) : null,
        metadata: input.metadata ?? undefined,
        requiredRole: input.requiredRole ?? "ADMIN",
        requesterId: input.requesterId,
        status: ApprovalStatus.PENDING,
      },
    });
  } catch (error) {
    console.error("[ApprovalEngine create error]:", error);
    throw error;
  }
}

/**
 * Tự động đồng bộ các nghiệp vụ PENDING (Phiếu thu, Đơn vượt hạn mức)
 * vào bảng ApprovalRequest để đảm bảo không bị sót việc.
 */
export async function syncPendingApprovals(): Promise<void> {
  try {
    // 1. Đồng bộ các phiếu thu nợ chưa có trong ApprovalRequest
    const receipts = await prisma.debtPayment.findMany({
      include: {
        customer: { select: { name: true } },
        user: { select: { id: true, name: true, email: true } },
      },
      take: 100,
      orderBy: { createdAt: "desc" },
    });

    for (const p of receipts) {
      const existing = await prisma.approvalRequest.findFirst({
        where: {
          targetType: ApprovalTargetType.DEBT_RECEIPT,
          targetId: p.id,
        },
      });

      let mappedStatus: ApprovalStatus = ApprovalStatus.PENDING;
      if (p.status === "APPROVED") mappedStatus = ApprovalStatus.APPROVED;
      if (p.status === "CANCELLED") mappedStatus = ApprovalStatus.CANCELLED;

      if (!existing) {
        await prisma.approvalRequest.create({
          data: {
            targetType: ApprovalTargetType.DEBT_RECEIPT,
            targetId: p.id,
            targetCode: p.receiptNumber,
            title: `Phiếu thu nợ ${p.receiptNumber}`,
            summary: `Khách hàng: ${p.customer.name} · Thu: ${formatVND(Number(p.amount))}`,
            amount: p.amount,
            requiredRole: "ACCOUNTANT",
            requesterId: p.userId,
            status: mappedStatus,
            decisionReason: p.cancelReason || (mappedStatus === ApprovalStatus.APPROVED ? "Đã duyệt thu tiền" : null),
            actionBy: p.approvedBy || p.cancelledBy || (mappedStatus === ApprovalStatus.APPROVED ? p.userId : null),
            actionAt: p.approvedAt || p.cancelledAt || (mappedStatus === ApprovalStatus.APPROVED ? p.createdAt : null),
            metadata: {
              customerId: p.customerId,
              customerName: p.customer.name,
              method: p.method,
              notes: p.notes,
            },
          },
        });
      }
    }

    // 2. Đồng bộ các đơn hàng có bảo lãnh vượt hạn mức
    const creditOrders = await prisma.order.findMany({
      where: {
        OR: [
          { isCreditOverride: true },
          { creditOverrideStatus: { in: ["PENDING", "APPROVED", "REJECTED"] } },
        ],
      },
      include: {
        customer: { select: { name: true, currentDebt: true, creditLimit: true } },
        user: { select: { id: true, name: true, email: true } },
        items: { select: { quantity: true, unitPrice: true } },
      },
      take: 100,
      orderBy: { createdAt: "desc" },
    });

    for (const o of creditOrders) {
      const existing = await prisma.approvalRequest.findFirst({
        where: {
          targetType: ApprovalTargetType.ORDER_CREDIT_OVERRIDE,
          targetId: o.id,
        },
      });

      let mappedStatus: ApprovalStatus = ApprovalStatus.PENDING;
      if (o.creditOverrideStatus === "APPROVED") mappedStatus = ApprovalStatus.APPROVED;
      if (o.creditOverrideStatus === "REJECTED") mappedStatus = ApprovalStatus.REJECTED;

      if (!existing) {
        const goodsTotal = o.items.reduce((sum, it) => sum + it.quantity * Number(it.unitPrice), 0);
        const totalPayable = Math.max(0, goodsTotal - Number(o.discountAmount) + Number(o.drumDepositAmount));

        await prisma.approvalRequest.create({
          data: {
            targetType: ApprovalTargetType.ORDER_CREDIT_OVERRIDE,
            targetId: o.id,
            targetCode: o.id,
            title: `Bảo lãnh nợ đơn ${o.id.slice(-6).toUpperCase()}`,
            summary: `Khách: ${o.customer.name} · Đơn: ${formatVND(totalPayable)} · Dư nợ: ${formatVND(Number(o.customer.currentDebt))}`,
            amount: totalPayable,
            requiredRole: "ADMIN",
            requesterId: o.userId,
            status: mappedStatus,
            actionBy: o.creditOverrideApprovedBy || (mappedStatus === ApprovalStatus.APPROVED ? o.userId : null),
            actionAt: mappedStatus !== ApprovalStatus.PENDING ? o.updatedAt : null,
            metadata: {
              customerId: o.customerId,
              customerName: o.customer.name,
              currentDebt: Number(o.customer.currentDebt),
              creditLimit: Number(o.customer.creditLimit),
              reason: o.creditOverrideReason,
            },
          },
        });
      }
    }
  } catch (err) {
    console.error("[ApprovalEngine sync error]:", err);
  }
}

/**
 * Lấy danh sách yêu cầu phê duyệt
 */
export async function listApprovalRequests(opts?: {
  status?: ApprovalStatus | "ALL";
  targetType?: ApprovalTargetType | "ALL";
  limit?: number;
}): Promise<{ items: ApprovalRequestItem[]; pendingCount: number }> {
  try {
    // Tự động đồng bộ các bản ghi chưa có
    await syncPendingApprovals();

    const where: Prisma.ApprovalRequestWhereInput = {};
    if (opts?.status && opts.status !== "ALL") {
      where.status = opts.status;
    }
    if (opts?.targetType && opts.targetType !== "ALL") {
      where.targetType = opts.targetType;
    }

    const [rawItems, pendingCount] = await Promise.all([
      prisma.approvalRequest.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: opts?.limit ?? 100,
        include: {
          requester: { select: { id: true, name: true, email: true } },
          actionUser: { select: { id: true, name: true, email: true } },
        },
      }),
      prisma.approvalRequest.count({
        where: { status: ApprovalStatus.PENDING },
      }),
    ]);

    const items: ApprovalRequestItem[] = rawItems.map((r) => ({
      id: r.id,
      targetType: r.targetType,
      targetId: r.targetId,
      targetCode: r.targetCode,
      title: r.title,
      summary: r.summary,
      amount: r.amount ? Number(r.amount) : null,
      metadata: r.metadata,
      requiredRole: r.requiredRole,
      requesterId: r.requesterId,
      requesterName: r.requester.name || r.requester.email.split("@")[0],
      status: r.status,
      decisionReason: r.decisionReason,
      actionBy: r.actionBy,
      actionUserName: r.actionUser?.name || r.actionUser?.email.split("@")[0],
      actionAt: r.actionAt?.toISOString() ?? null,
      createdAt: r.createdAt.toISOString(),
    }));

    return { items, pendingCount };
  } catch (error) {
    console.error("[ApprovalEngine list error]:", error);
    return { items: [], pendingCount: 0 };
  }
}

/**
 * Xử lý phê duyệt (Duyệt hoặc Từ chối)
 */
export async function decideApprovalRequest(input: {
  requestId: string;
  decision: "APPROVE" | "REJECT";
  reason?: string;
  approverId: string;
  approverRole: string;
}): Promise<{ success: boolean; message: string }> {
  try {
    const request = await prisma.approvalRequest.findUnique({
      where: { id: input.requestId },
    });

    if (!request) {
      return { success: false, message: "Không tìm thấy yêu cầu phê duyệt." };
    }

    if (request.status !== ApprovalStatus.PENDING) {
      return { success: false, message: `Yêu cầu này đã được xử lý (${request.status}).` };
    }

    // Thực thi logic nghiệp vụ gốc
    if (input.decision === "APPROVE") {
      if (request.targetType === ApprovalTargetType.DEBT_RECEIPT) {
        const res = await approveDebtPayment(request.targetId);
        if (!res.success) {
          return { success: false, message: res.error || res.message };
        }
      } else if (request.targetType === ApprovalTargetType.ORDER_CREDIT_OVERRIDE) {
        // Cập nhật Order sang APPROVED
        await prisma.order.update({
          where: { id: request.targetId },
          data: {
            creditOverrideStatus: "APPROVED",
            creditOverrideApprovedBy: input.approverId,
            status: "CONFIRMED", // Tự động xác nhận đơn hàng xuất kho
          },
        });
      }

      // Cập nhật trạng thái ApprovalRequest
      await prisma.approvalRequest.update({
        where: { id: input.requestId },
        data: {
          status: ApprovalStatus.APPROVED,
          decisionReason: input.reason || "Đã phê duyệt thành công",
          actionBy: input.approverId,
          actionAt: new Date(),
        },
      });

      return {
        success: true,
        message: `Đã phê duyệt thành công: ${request.title}`,
      };
    } else {
      // Từ chối (REJECT)
      if (request.targetType === ApprovalTargetType.DEBT_RECEIPT) {
        await cancelDebtPayment(request.targetId, input.reason || "Bị từ chối phê duyệt");
      } else if (request.targetType === ApprovalTargetType.ORDER_CREDIT_OVERRIDE) {
        await prisma.order.update({
          where: { id: request.targetId },
          data: {
            creditOverrideStatus: "REJECTED",
            creditOverrideReason: input.reason || "Bị từ chối bảo lãnh vượt hạn mức",
          },
        });
      }

      await prisma.approvalRequest.update({
        where: { id: input.requestId },
        data: {
          status: ApprovalStatus.REJECTED,
          decisionReason: input.reason || "Từ chối phê duyệt",
          actionBy: input.approverId,
          actionAt: new Date(),
        },
      });

      return {
        success: true,
        message: `Đã từ chối: ${request.title}`,
      };
    }
  } catch (error) {
    console.error("[ApprovalEngine decide error]:", error);
    const msg = error instanceof Error ? error.message : "Lỗi xử lý phê duyệt.";
    return { success: false, message: msg };
  }
}
