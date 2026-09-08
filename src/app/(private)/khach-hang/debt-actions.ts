"use server";

import { revalidatePath } from "next/cache";
import { PaymentMethod, Prisma } from "@prisma/client";
import { getSessionDbUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export type DebtPaymentResult = {
  success: boolean;
  message: string;
  error?: string;
  payment?: {
    id: string;
    receiptNumber: string;
    amount: number;
    method: string;
    createdAt: string;
  };
};

export async function createDebtPayment(input: {
  customerId: string;
  amount: number;
  method?: "CASH" | "BANK_TRANSFER";
  notes?: string;
}): Promise<DebtPaymentResult> {
  const { dbUser } = await getSessionDbUser();

  const customerId = String(input.customerId ?? "").trim();
  if (!customerId) {
    return { success: false, message: "Thiếu thông tin khách hàng." };
  }

  const amount = Number(input.amount);
  if (!Number.isFinite(amount) || amount <= 0) {
    return { success: false, message: "Số tiền thu nợ phải lớn hơn 0." };
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

      // Ensure a valid user for recording collector
      let collectorUserId = dbUser?.id;
      if (!collectorUserId) {
        const firstAdmin = await tx.user.findFirst({
          select: { id: true },
        });
        collectorUserId = firstAdmin?.id;
      }

      if (!collectorUserId) {
        throw new Error("Không xác định được người lập phiếu thu.");
      }

      const now = new Date();
      const ym = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`;
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const receiptNumber = `PT-${ym}-${randomSuffix}`;

      const newPayment = await tx.debtPayment.create({
        data: {
          receiptNumber,
          customerId,
          amount: new Prisma.Decimal(amount),
          method,
          notes,
          userId: collectorUserId,
        },
      });

      const currentDebtNum = Number(customer.currentDebt);
      const updatedDebt = Math.max(0, currentDebtNum - amount);

      await tx.customer.update({
        where: { id: customerId },
        data: {
          currentDebt: new Prisma.Decimal(updatedDebt),
        },
      });

      return newPayment;
    });

    revalidatePath("/khach-hang");
    revalidatePath("/don-hang");
    revalidatePath("/dashboard");
    revalidatePath("/sales");

    return {
      success: true,
      message: `Đã lập phiếu thu ${payment.receiptNumber} thành công (${amount.toLocaleString("vi-VN")} đ).`,
      payment: {
        id: payment.id,
        receiptNumber: payment.receiptNumber,
        amount: Number(payment.amount),
        method: payment.method,
        createdAt: payment.createdAt.toISOString(),
      },
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Lỗi khi lập phiếu thu nợ.";
    return { success: false, message: msg, error: msg };
  }
}

export async function listCustomerPayments(customerId: string) {
  try {
    const list = await prisma.debtPayment.findMany({
      where: { customerId },
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { name: true, email: true } },
      },
    });

    return list.map((p) => ({
      id: p.id,
      receiptNumber: p.receiptNumber,
      customerId: p.customerId,
      amount: Number(p.amount),
      method: p.method as "CASH" | "BANK_TRANSFER",
      notes: p.notes,
      userId: p.userId,
      userName: p.user?.name || p.user?.email || "Nhân viên",
      createdAt: p.createdAt.toISOString(),
    }));
  } catch {
    return [];
  }
}

export async function listRecentPayments(limit = 20) {
  try {
    const list = await prisma.debtPayment.findMany({
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        customer: { select: { name: true } },
        user: { select: { name: true, email: true } },
      },
    });

    return list.map((p) => ({
      id: p.id,
      receiptNumber: p.receiptNumber,
      customerId: p.customerId,
      customerName: p.customer.name,
      amount: Number(p.amount),
      method: p.method as "CASH" | "BANK_TRANSFER",
      notes: p.notes,
      userId: p.userId,
      userName: p.user?.name || p.user?.email || "Nhân viên",
      createdAt: p.createdAt.toISOString(),
    }));
  } catch {
    return [];
  }
}
