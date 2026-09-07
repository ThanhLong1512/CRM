"use server";

import { revalidatePath } from "next/cache";
import { getSessionDbUser } from "@/lib/auth";
import { listDrumTransactions } from "@/lib/data/drums";
import { prisma } from "@/lib/prisma";

export type DrumActionResult = {
  success: boolean;
  message: string;
  error?: string;
};

function fail(message: string): DrumActionResult {
  return { success: false, message, error: message };
}

function ok(message: string): DrumActionResult {
  return { success: true, message };
}

function revalidateDrumPaths() {
  revalidatePath("/vo-phuy");
}

async function requireActor() {
  const { dbUser } = await getSessionDbUser();
  if (!dbUser) {
    throw new Error("Bạn cần đăng nhập để ghi sổ vỏ phuy.");
  }
  return dbUser;
}

export async function issueDrums(input: {
  customerId: string;
  quantity: number;
  productId?: string;
  notes?: string;
}): Promise<DrumActionResult> {
  const customerId = String(input.customerId ?? "").trim();
  const notes = String(input.notes ?? "").trim() || null;
  const productId = String(input.productId ?? "").trim() || null;
  const quantity = Number(input.quantity);

  if (!customerId) return fail("Vui lòng chọn khách hàng.");
  if (!Number.isInteger(quantity) || quantity <= 0) {
    return fail("Số lượng xuất phải là số nguyên dương.");
  }

  try {
    const actor = await requireActor();

    await prisma.$transaction(async (tx) => {
      const customer = await tx.customer.findUnique({
        where: { id: customerId },
        select: { id: true, outstandingDrums: true },
      });
      if (!customer) throw new Error("Không tìm thấy khách hàng.");

      if (productId) {
        const product = await tx.product.findUnique({
          where: { id: productId },
          select: { id: true, isDrum: true },
        });
        if (!product || !product.isDrum) {
          throw new Error("Sản phẩm không phải loại vỏ phuy.");
        }
      }

      await tx.drumTransaction.create({
        data: {
          customerId,
          type: "ISSUE",
          quantity,
          productId,
          notes,
          userId: actor.id,
        },
      });

      await tx.customer.update({
        where: { id: customerId },
        data: { outstandingDrums: customer.outstandingDrums + quantity },
      });
    });
  } catch (error) {
    return fail(
      error instanceof Error ? error.message : "Không thể ghi xuất vỏ phuy.",
    );
  }

  revalidateDrumPaths();
  return ok(`Đã xuất ${quantity} vỏ phuy.`);
}

export async function returnDrums(input: {
  customerId: string;
  quantity: number;
  notes?: string;
}): Promise<DrumActionResult> {
  const customerId = String(input.customerId ?? "").trim();
  const notes = String(input.notes ?? "").trim() || null;
  const quantity = Number(input.quantity);

  if (!customerId) return fail("Vui lòng chọn khách hàng.");
  if (!Number.isInteger(quantity) || quantity <= 0) {
    return fail("Số lượng thu phải là số nguyên dương.");
  }

  try {
    const actor = await requireActor();

    await prisma.$transaction(async (tx) => {
      const customer = await tx.customer.findUnique({
        where: { id: customerId },
        select: { id: true, outstandingDrums: true },
      });
      if (!customer) throw new Error("Không tìm thấy khách hàng.");
      if (quantity > customer.outstandingDrums) {
        throw new Error(
          `Không thể thu ${quantity} — khách chỉ đang giữ ${customer.outstandingDrums} vỏ.`,
        );
      }

      await tx.drumTransaction.create({
        data: {
          customerId,
          type: "RETURN",
          quantity,
          notes,
          userId: actor.id,
        },
      });

      await tx.customer.update({
        where: { id: customerId },
        data: { outstandingDrums: customer.outstandingDrums - quantity },
      });
    });
  } catch (error) {
    return fail(
      error instanceof Error ? error.message : "Không thể ghi thu vỏ phuy.",
    );
  }

  revalidateDrumPaths();
  return ok(`Đã thu ${quantity} vỏ phuy.`);
}

/** Điều chỉnh số dư đang giữ về đúng `targetOutstanding`. */
export async function adjustDrums(input: {
  customerId: string;
  targetOutstanding: number;
  notes?: string;
}): Promise<DrumActionResult> {
  const customerId = String(input.customerId ?? "").trim();
  const notes = String(input.notes ?? "").trim() || null;
  const target = Number(input.targetOutstanding);

  if (!customerId) return fail("Vui lòng chọn khách hàng.");
  if (!Number.isInteger(target) || target < 0) {
    return fail("Số dư mục tiêu phải là số nguyên ≥ 0.");
  }

  try {
    const actor = await requireActor();

    await prisma.$transaction(async (tx) => {
      const customer = await tx.customer.findUnique({
        where: { id: customerId },
        select: { id: true, outstandingDrums: true },
      });
      if (!customer) throw new Error("Không tìm thấy khách hàng.");

      const delta = target - customer.outstandingDrums;
      if (delta === 0) {
        throw new Error("Số dư đã đúng — không cần điều chỉnh.");
      }

      await tx.drumTransaction.create({
        data: {
          customerId,
          type: "ADJUST",
          quantity: Math.abs(delta),
          notes:
            notes ??
            `Điều chỉnh từ ${customer.outstandingDrums} → ${target}`,
          userId: actor.id,
        },
      });

      await tx.customer.update({
        where: { id: customerId },
        data: { outstandingDrums: target },
      });
    });
  } catch (error) {
    return fail(
      error instanceof Error
        ? error.message
        : "Không thể điều chỉnh số dư vỏ phuy.",
    );
  }

  revalidateDrumPaths();
  return ok(`Đã điều chỉnh số dư về ${target} vỏ.`);
}

export async function getCustomerDrumHistory(customerId: string) {
  const id = String(customerId ?? "").trim();
  if (!id) return [];
  return listDrumTransactions(id);
}
