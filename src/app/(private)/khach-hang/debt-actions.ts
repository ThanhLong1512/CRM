"use server";

import { revalidatePath } from "next/cache";
import {
  DebtPaymentStatus,
  PaymentMethod,
  Prisma,
  type UserRole,
} from "@prisma/client";
import { getSessionDbUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatVND } from "@/lib/formatMoney";

export type DebtPaymentResult = {
  success: boolean;
  message: string;
  error?: string;
  payment?: {
    id: string;
    receiptNumber: string;
    amount: number;
    method: string;
    status: DebtPaymentStatus;
    createdAt: string;
  };
};

export type DebtPaymentListItem = {
  id: string;
  receiptNumber: string;
  customerId: string;
  customerName?: string;
  amount: number;
  method: "CASH" | "BANK_TRANSFER";
  notes: string | null;
  status: DebtPaymentStatus;
  approvedBy: string | null;
  approvedAt: string | null;
  cancelledBy: string | null;
  cancelledAt: string | null;
  cancelReason: string | null;
  userId: string;
  userName?: string;
  createdAt: string;
};

function fail(message: string): DebtPaymentResult {
  return { success: false, message, error: message };
}

function ok(
  message: string,
  payment?: DebtPaymentResult["payment"],
): DebtPaymentResult {
  return { success: true, message, payment };
}

function canApproveOrCancelApproved(role: UserRole | string): boolean {
  return role === "ADMIN" || role === "ACCOUNTANT";
}

function mapPayment(p: {
  id: string;
  receiptNumber: string;
  amount: Prisma.Decimal | number;
  method: PaymentMethod;
  status: DebtPaymentStatus;
  createdAt: Date;
}): DebtPaymentResult["payment"] {
  return {
    id: p.id,
    receiptNumber: p.receiptNumber,
    amount: Number(p.amount),
    method: p.method,
    status: p.status,
    createdAt: p.createdAt.toISOString(),
  };
}

function mapListItem(p: {
  id: string;
  receiptNumber: string;
  customerId: string;
  amount: Prisma.Decimal | number;
  method: PaymentMethod;
  notes: string | null;
  status: DebtPaymentStatus;
  approvedBy: string | null;
  approvedAt: Date | null;
  cancelledBy: string | null;
  cancelledAt: Date | null;
  cancelReason: string | null;
  userId: string;
  createdAt: Date;
  customer?: { name: string } | null;
  user?: { name: string | null; email: string } | null;
}): DebtPaymentListItem {
  return {
    id: p.id,
    receiptNumber: p.receiptNumber,
    customerId: p.customerId,
    customerName: p.customer?.name,
    amount: Number(p.amount),
    method: p.method as "CASH" | "BANK_TRANSFER",
    notes: p.notes,
    status: p.status,
    approvedBy: p.approvedBy,
    approvedAt: p.approvedAt?.toISOString() ?? null,
    cancelledBy: p.cancelledBy,
    cancelledAt: p.cancelledAt?.toISOString() ?? null,
    cancelReason: p.cancelReason,
    userId: p.userId,
    userName: p.user?.name || p.user?.email || "Nhân viên",
    createdAt: p.createdAt.toISOString(),
  };
}

function revalidateDebtPaths() {
  revalidatePath("/khach-hang");
  revalidatePath("/phieu-thu");
  revalidatePath("/don-hang");
  revalidatePath("/dashboard");
  revalidatePath("/sales");
}

/** Sale / Admin / KT lập phiếu — chưa trừ nợ (PENDING). */
export async function createDebtPayment(input: {
  customerId: string;
  amount: number;
  method?: "CASH" | "BANK_TRANSFER";
  notes?: string;
}): Promise<DebtPaymentResult> {
  const { dbUser } = await getSessionDbUser();
  if (!dbUser) {
    return fail("Bạn cần đăng nhập để lập phiếu thu.");
  }

  const customerId = String(input.customerId ?? "").trim();
  if (!customerId) {
    return fail("Thiếu thông tin khách hàng.");
  }

  const amount = Number(input.amount);
  if (!Number.isFinite(amount) || amount <= 0) {
    return fail("Số tiền thu nợ phải lớn hơn 0.");
  }

  const method: PaymentMethod =
    input.method === "BANK_TRANSFER"
      ? PaymentMethod.BANK_TRANSFER
      : PaymentMethod.CASH;

  const notes = input.notes ? String(input.notes).trim() : null;

  try {
    const payment = await prisma.$transaction(async (tx) => {
      const customer = await tx.customer.findUnique({
        where: { id: customerId },
        select: { id: true, name: true, currentDebt: true },
      });

      if (!customer) {
        throw new Error("Không tìm thấy khách hàng.");
      }

      const currentDebtNum = Number(customer.currentDebt);
      if (amount > currentDebtNum + 0.0001) {
        throw new Error(
          `Số tiền thu (${formatVND(amount)}) vượt dư nợ hiện tại (${formatVND(currentDebtNum)}).`,
        );
      }

      const now = new Date();
      const ym = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`;
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const receiptNumber = `PT-${ym}-${randomSuffix}`;

      const created = await tx.debtPayment.create({
        data: {
          receiptNumber,
          customerId,
          amount: new Prisma.Decimal(amount),
          method,
          notes,
          status: DebtPaymentStatus.PENDING,
          userId: dbUser.id,
        },
      });

      // Tự động tạo yêu cầu phê duyệt tập trung
      await tx.approvalRequest.create({
        data: {
          targetType: "DEBT_RECEIPT",
          targetId: created.id,
          targetCode: receiptNumber,
          title: `Phiếu thu nợ ${receiptNumber}`,
          summary: `Khách hàng: ${customer.name} · Thu: ${formatVND(amount)}`,
          amount: new Prisma.Decimal(amount),
          requiredRole: "ACCOUNTANT",
          requesterId: dbUser.id,
          status: "PENDING",
          metadata: {
            customerId,
            customerName: customer.name,
            method,
            notes,
          },
        },
      });

      return created;
    });

    revalidateDebtPaths();

    return ok(
      `Đã lập phiếu ${payment.receiptNumber} — chờ Kế toán/Admin duyệt (chưa trừ nợ).`,
      mapPayment(payment),
    );
  } catch (error) {
    const msg =
      error instanceof Error ? error.message : "Lỗi khi lập phiếu thu nợ.";
    return fail(msg);
  }
}

/** Admin / KT duyệt → trừ currentDebt. */
export async function approveDebtPayment(
  paymentId: string,
): Promise<DebtPaymentResult> {
  const { dbUser } = await getSessionDbUser();
  if (!dbUser) {
    return fail("Bạn cần đăng nhập để duyệt phiếu thu.");
  }
  if (!canApproveOrCancelApproved(dbUser.role)) {
    return fail("Chỉ Admin hoặc Kế toán được duyệt phiếu thu.");
  }

  const id = String(paymentId ?? "").trim();
  if (!id) {
    return fail("Thiếu mã phiếu thu.");
  }

  try {
    const payment = await prisma.$transaction(async (tx) => {
      const existing = await tx.debtPayment.findUnique({
        where: { id },
        include: { customer: { select: { id: true, name: true, currentDebt: true } } },
      });

      if (!existing) {
        throw new Error("Không tìm thấy phiếu thu.");
      }
      if (existing.status !== DebtPaymentStatus.PENDING) {
        throw new Error(
          `Chỉ duyệt phiếu đang chờ. Trạng thái hiện tại: ${existing.status}.`,
        );
      }

      const amount = Number(existing.amount);
      const currentDebtNum = Number(existing.customer.currentDebt);
      if (amount > currentDebtNum + 0.0001) {
        throw new Error(
          `Không duyệt được: số tiền phiếu vượt dư nợ hiện tại của “${existing.customer.name}” (${formatVND(currentDebtNum)}).`,
        );
      }

      const updatedDebt = Math.max(0, currentDebtNum - amount);

      await tx.customer.update({
        where: { id: existing.customerId },
        data: { currentDebt: new Prisma.Decimal(updatedDebt) },
      });

      await tx.approvalRequest.updateMany({
        where: {
          targetType: "DEBT_RECEIPT",
          targetId: id,
        },
        data: {
          status: "APPROVED",
          actionBy: dbUser.id,
          actionAt: new Date(),
          decisionReason: "Đã duyệt từ sổ phiếu thu",
        },
      });

      return tx.debtPayment.update({
        where: { id },
        data: {
          status: DebtPaymentStatus.APPROVED,
          approvedBy: dbUser.id,
          approvedAt: new Date(),
        },
      });
    });

    revalidateDebtPaths();
    return ok(
      `Đã duyệt phiếu ${payment.receiptNumber} — đã trừ công nợ.`,
      mapPayment(payment),
    );
  } catch (error) {
    const msg =
      error instanceof Error ? error.message : "Lỗi khi duyệt phiếu thu.";
    return fail(msg);
  }
}

/** Hủy phiếu: PENDING (người lập hoặc Admin/KT); APPROVED chỉ Admin/KT + hoàn tác nợ. */
export async function cancelDebtPayment(
  paymentId: string,
  reason?: string,
): Promise<DebtPaymentResult> {
  const { dbUser } = await getSessionDbUser();
  if (!dbUser) {
    return fail("Bạn cần đăng nhập để hủy phiếu thu.");
  }

  const id = String(paymentId ?? "").trim();
  if (!id) {
    return fail("Thiếu mã phiếu thu.");
  }

  const cancelReason = reason?.trim() || null;

  try {
    const payment = await prisma.$transaction(async (tx) => {
      const existing = await tx.debtPayment.findUnique({
        where: { id },
        include: { customer: { select: { id: true, currentDebt: true } } },
      });

      if (!existing) {
        throw new Error("Không tìm thấy phiếu thu.");
      }
      if (existing.status === DebtPaymentStatus.CANCELLED) {
        throw new Error("Phiếu đã bị hủy trước đó.");
      }

      const isApprover = canApproveOrCancelApproved(dbUser.role);
      const isCreator = existing.userId === dbUser.id;

      if (existing.status === DebtPaymentStatus.PENDING) {
        if (!isCreator && !isApprover) {
          throw new Error("Chỉ người lập phiếu hoặc Admin/Kế toán được hủy phiếu chờ duyệt.");
        }
      } else if (existing.status === DebtPaymentStatus.APPROVED) {
        if (!isApprover) {
          throw new Error("Chỉ Admin hoặc Kế toán được hủy phiếu đã duyệt (hoàn tác nợ).");
        }
        const amount = Number(existing.amount);
        const currentDebtNum = Number(existing.customer.currentDebt);
        await tx.customer.update({
          where: { id: existing.customerId },
          data: {
            currentDebt: new Prisma.Decimal(currentDebtNum + amount),
          },
        });
      }

      await tx.approvalRequest.updateMany({
        where: {
          targetType: "DEBT_RECEIPT",
          targetId: id,
        },
        data: {
          status: "CANCELLED",
          actionBy: dbUser.id,
          actionAt: new Date(),
          decisionReason: cancelReason || "Người dùng hủy phiếu",
        },
      });

      return tx.debtPayment.update({
        where: { id },
        data: {
          status: DebtPaymentStatus.CANCELLED,
          cancelledBy: dbUser.id,
          cancelledAt: new Date(),
          cancelReason,
        },
      });
    });

    revalidateDebtPaths();
    return ok(`Đã hủy phiếu ${payment.receiptNumber}.`, mapPayment(payment));
  } catch (error) {
    const msg =
      error instanceof Error ? error.message : "Lỗi khi hủy phiếu thu.";
    return fail(msg);
  }
}

export async function listCustomerPayments(
  customerId: string,
): Promise<DebtPaymentListItem[]> {
  try {
    const list = await prisma.debtPayment.findMany({
      where: { customerId },
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { name: true, email: true } },
        customer: { select: { name: true } },
      },
    });
    return list.map(mapListItem);
  } catch {
    return [];
  }
}

export async function listDebtPayments(opts?: {
  status?: DebtPaymentStatus | "ALL";
  limit?: number;
}): Promise<DebtPaymentListItem[]> {
  try {
    const status = opts?.status && opts.status !== "ALL" ? opts.status : undefined;
    const list = await prisma.debtPayment.findMany({
      where: status ? { status } : undefined,
      take: opts?.limit ?? 100,
      orderBy: { createdAt: "desc" },
      include: {
        customer: { select: { name: true } },
        user: { select: { name: true, email: true } },
      },
    });
    return list.map(mapListItem);
  } catch {
    return [];
  }
}

export async function listRecentPayments(limit = 20) {
  return listDebtPayments({ limit });
}
