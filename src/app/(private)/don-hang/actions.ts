"use server";

import { revalidatePath } from "next/cache";
import { OrderStatus, Prisma } from "@prisma/client";
import { getSessionDbUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export type OrderActionResult = {
  success: boolean;
  message: string;
  error?: string;
};

export type CreateOrderItemInput = {
  productId: string;
  quantity: number;
};

const KANBAN_STATUSES: OrderStatus[] = [
  OrderStatus.PENDING,
  OrderStatus.CONFIRMED,
  OrderStatus.SHIPPED,
];

function fail(message: string): OrderActionResult {
  return { success: false, message, error: message };
}

function ok(message: string): OrderActionResult {
  return { success: true, message };
}

function orderTotal(
  items: { quantity: number; unitPrice: Prisma.Decimal | number }[],
): number {
  return items.reduce(
    (sum, item) => sum + item.quantity * Number(item.unitPrice),
    0,
  );
}

function revalidateOrderPaths() {
  revalidatePath("/don-hang");
  revalidatePath("/khach-hang");
  revalidatePath("/san-pham");
  revalidatePath("/dashboard");
}

function getProductLiters(product: { volume?: string | null; isDrum?: boolean }): number {
  if (product.isDrum) return 200;
  const vol = String(product.volume || "").toLowerCase();
  const num = parseFloat(vol.replace(/[^\d.]/g, ""));
  if (Number.isFinite(num) && num > 0) {
    return num;
  }
  return 1;
}

export async function createOrder(input: {
  customerId: string;
  items: CreateOrderItemInput[];
  localId?: string | null;
  discountPercent?: number;
  discountAmount?: number;
  promotionNotes?: string | null;
}): Promise<OrderActionResult> {
  const { dbUser } = await getSessionDbUser();
  if (!dbUser) {
    return fail("Bạn cần đăng nhập để tạo đơn hàng.");
  }

  const customerId = String(input.customerId ?? "").trim();
  if (!customerId) {
    return fail("Vui lòng chọn khách hàng.");
  }

  const localId = String(input.localId ?? "").trim() || null;
  if (localId) {
    const existing = await prisma.order.findUnique({
      where: { localId },
      select: { id: true },
    });
    if (existing) {
      return ok("Đơn offline đã được đồng bộ trước đó.");
    }
  }

  const rawItems = Array.isArray(input.items) ? input.items : [];
  if (rawItems.length === 0) {
    return fail("Đơn hàng cần ít nhất một sản phẩm.");
  }

  const qtyByProduct = new Map<string, number>();
  for (const item of rawItems) {
    const productId = String(item.productId ?? "").trim();
    const quantity = Number(item.quantity);
    if (!productId) {
      return fail("Thiếu mã sản phẩm trong dòng hàng.");
    }
    if (!Number.isInteger(quantity) || quantity <= 0) {
      return fail("Số lượng sản phẩm phải là số nguyên dương.");
    }
    qtyByProduct.set(productId, (qtyByProduct.get(productId) ?? 0) + quantity);
  }

  const productIds = Array.from(qtyByProduct.keys());

  try {
    await prisma.$transaction(async (tx) => {
      const customer = await tx.customer.findUnique({
        where: { id: customerId },
      });
      if (!customer) {
        throw new Error("Không tìm thấy khách hàng.");
      }

      const products = await tx.product.findMany({
        where: { id: { in: productIds } },
      });
      if (products.length !== productIds.length) {
        throw new Error("Một hoặc nhiều sản phẩm không tồn tại.");
      }

      let totalLiters = 0;
      const lineItems = products.map((product) => {
        const quantity = qtyByProduct.get(product.id) ?? 0;
        if (product.stock < quantity) {
          throw new Error(
            `Không đủ tồn kho cho “${product.name}” (còn ${product.stock}).`,
          );
        }
        const unitLiters = getProductLiters(product);
        totalLiters += unitLiters * quantity;
        return {
          productId: product.id,
          quantity,
          unitPrice: product.unitPrice,
          unitLiters,
        };
      });

      const rawTotal = orderTotal(lineItems);
      const discountPercent = Math.max(0, Math.min(100, Number(input.discountPercent || 0)));
      let discountAmount = Math.max(0, Number(input.discountAmount || 0));
      if (discountAmount === 0 && discountPercent > 0) {
        discountAmount = Math.round((rawTotal * discountPercent) / 100);
      }
      const finalTotal = Math.max(0, rawTotal - discountAmount);

      const currentDebt = Number(customer.currentDebt);
      const creditLimit = Number(customer.creditLimit);

      if (currentDebt + finalTotal > creditLimit) {
        throw new Error(
          `Vượt hạn mức công nợ. Dư nợ ${currentDebt.toLocaleString("vi-VN")} + đơn ${finalTotal.toLocaleString("vi-VN")} > hạn mức ${creditLimit.toLocaleString("vi-VN")}.`,
        );
      }

      await tx.order.create({
        data: {
          status: OrderStatus.PENDING,
          userId: dbUser.id,
          customerId,
          localId,
          discountPercent,
          discountAmount: new Prisma.Decimal(discountAmount),
          promotionNotes: input.promotionNotes ? String(input.promotionNotes).trim() : null,
          totalLiters,
          syncedAt: localId ? new Date() : null,
          items: {
            create: lineItems.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
            })),
          },
        },
      });

      await tx.customer.update({
        where: { id: customerId },
        data: {
          currentDebt: new Prisma.Decimal(currentDebt + finalTotal),
        },
      });

      for (const item of lineItems) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        });
      }
    });
  } catch (error) {
    return fail(
      error instanceof Error
        ? error.message
        : "Không thể tạo đơn hàng. Vui lòng thử lại.",
    );
  }

  revalidateOrderPaths();
  return ok(
    localId
      ? "Đã đồng bộ đơn offline thành công."
      : "Đã tạo đơn hàng thành công.",
  );
}

export async function updateOrderStatus(
  orderId: string,
  nextStatus: OrderStatus,
): Promise<OrderActionResult> {
  if (!orderId) {
    return fail("Thiếu mã đơn hàng.");
  }

  const { dbUser } = await getSessionDbUser();
  if (!dbUser) {
    return fail("Bạn cần đăng nhập.");
  }

  try {
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) {
      return fail("Không tìm thấy đơn hàng.");
    }
    if (
      order.status === OrderStatus.CANCELLED ||
      nextStatus === OrderStatus.CANCELLED
    ) {
      return fail("Không thể đổi trạng thái đơn đã hủy qua thao tác này.");
    }

    if (
      !KANBAN_STATUSES.includes(order.status) ||
      !KANBAN_STATUSES.includes(nextStatus)
    ) {
      return fail("Chỉ được chuyển giữa Chờ duyệt, Xuất kho và Đã giao.");
    }

    if (order.status === nextStatus) {
      return ok("Trạng thái đơn hàng không đổi.");
    }

    await prisma.order.update({
      where: { id: orderId },
      data: { status: nextStatus },
    });
  } catch (error) {
    return fail(
      error instanceof Error
        ? error.message
        : "Không thể cập nhật trạng thái đơn.",
    );
  }

  revalidateOrderPaths();
  return ok("Đã cập nhật trạng thái đơn hàng.");
}

export async function cancelOrder(orderId: string): Promise<OrderActionResult> {
  if (!orderId) {
    return fail("Thiếu mã đơn hàng.");
  }

  const { dbUser } = await getSessionDbUser();
  if (!dbUser) {
    return fail("Bạn cần đăng nhập.");
  }

  try {
    await prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: { items: true },
      });
      if (!order) {
        throw new Error("Không tìm thấy đơn hàng.");
      }
      if (order.status === OrderStatus.CANCELLED) {
        throw new Error("Đơn hàng đã được hủy trước đó.");
      }

      const total = orderTotal(order.items);
      const customer = await tx.customer.findUnique({
        where: { id: order.customerId },
      });
      if (!customer) {
        throw new Error("Không tìm thấy khách hàng của đơn.");
      }

      const nextDebt = Math.max(0, Number(customer.currentDebt) - total);

      await tx.order.update({
        where: { id: orderId },
        data: { status: OrderStatus.CANCELLED },
      });

      await tx.customer.update({
        where: { id: order.customerId },
        data: { currentDebt: new Prisma.Decimal(nextDebt) },
      });

      for (const item of order.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } },
        });
      }
    });
  } catch (error) {
    return fail(
      error instanceof Error
        ? error.message
        : "Không thể hủy đơn hàng. Vui lòng thử lại.",
    );
  }

  revalidateOrderPaths();
  return ok("Đã hủy đơn hàng và hoàn dư nợ / tồn kho.");
}
