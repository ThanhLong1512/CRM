"use server";

import { revalidatePath } from "next/cache";
import { OrderStatus, Prisma, DealerTier } from "@prisma/client";
import { getSessionDbUser, requireRoles } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getLitersFromVolume } from "@/lib/unitConverter";
import { resolveTierUnitPrice, calculateVolumeDiscount, type CustomerDealerTier } from "@/lib/pricingEngine";
import { formatVND } from "@/lib/formatMoney";

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
  OrderStatus.DELIVERED,
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
  revalidatePath("/vo-phuy");
}

export async function createOrder(input: {
  customerId: string;
  items: CreateOrderItemInput[];
  localId?: string | null;
  discountPercent?: number;
  discountAmount?: number;
  promotionNotes?: string | null;
  drumDelivered?: number;
  drumReturned?: number;
  drumDepositUnitPrice?: number;
  isCreditOverride?: boolean;
  creditOverrideReason?: string;
  signature?: string;
  signedBy?: string;
}): Promise<OrderActionResult> {
  let dbUser;
  try {
    dbUser = await requireRoles(["ADMIN", "ACCOUNTANT", "SALES", "DEALER", "FLEET"]);
  } catch (authErr: any) {
    return fail(authErr.message);
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

      const customerTier: CustomerDealerTier =
        customer.dealerTier === "GOLD"
          ? "GOLD"
          : customer.dealerTier === "RETAIL"
          ? "RETAIL"
          : "SILVER";

      let totalLiters = 0;
      const lineItems = products.map((product) => {
        const quantity = qtyByProduct.get(product.id) ?? 0;
        if (product.stock < quantity) {
          throw new Error(
            `Không đủ tồn kho cho “${product.name}” (còn ${product.stock}).`,
          );
        }
        // Standard Industrial volume calculation: Drum = 208L, Pail = 18L, Can = 4L, Bottle = 1L
        const unitLiters = getLitersFromVolume(product.volume, product.isDrum);
        totalLiters += unitLiters * quantity;

        const tierPrice = resolveTierUnitPrice(
          {
            id: product.id,
            unitPrice: Number(product.unitPrice),
            wholesalePrice: product.wholesalePrice ? Number(product.wholesalePrice) : null,
            garagePrice: product.garagePrice ? Number(product.garagePrice) : null,
            retailPrice: product.retailPrice ? Number(product.retailPrice) : null,
            volume: product.volume,
            isDrum: product.isDrum,
          },
          customerTier
        );

        return {
          productId: product.id,
          product,
          quantity,
          unitPrice: new Prisma.Decimal(tierPrice),
          unitLiters,
        };
      });

      // Volume discount calculation
      const pricingResult = calculateVolumeDiscount(
        lineItems.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          product: {
            id: item.product.id,
            unitPrice: Number(item.product.unitPrice),
            wholesalePrice: item.product.wholesalePrice ? Number(item.product.wholesalePrice) : null,
            garagePrice: item.product.garagePrice ? Number(item.product.garagePrice) : null,
            retailPrice: item.product.retailPrice ? Number(item.product.retailPrice) : null,
            volume: item.product.volume,
            isDrum: item.product.isDrum,
          },
        })),
        customerTier,
        Number(input.discountPercent || 0)
      );

      const netGoodsTotal = pricingResult.netTotal;
      const discountAmount = pricingResult.discountAmount;
      const discountPercent = pricingResult.discountPercent;

      // Drum Deposit & Exchange calculations
      const drumDelivered = Math.max(0, Number(input.drumDelivered || 0));
      const drumReturned = Math.max(0, Number(input.drumReturned || 0));
      const depositUnitPrice = Math.max(0, Number(input.drumDepositUnitPrice || 400000));
      const netDrumChange = drumDelivered - drumReturned;
      const drumDepositTotal = netDrumChange * depositUnitPrice;

      // Net order payable: Oil products + Net drum deposit (deducts if more empty drums returned)
      const finalTotal = Math.max(0, netGoodsTotal + drumDepositTotal);

      const currentDebt = Number(customer.currentDebt);
      const creditLimit = Number(customer.creditLimit);
      const isOverLimit = currentDebt + finalTotal > creditLimit;

      let isCreditOverride = Boolean(input.isCreditOverride);
      let creditOverrideReason = input.creditOverrideReason ? String(input.creditOverrideReason).trim() : null;
      let creditOverrideStatus = "NONE";

      if (isOverLimit) {
        if (!isCreditOverride && !creditOverrideReason) {
          throw new Error(
            `Vượt hạn mức công nợ. Dư nợ ${formatVND(currentDebt)} + đơn ${formatVND(finalTotal)} > hạn mức ${formatVND(creditLimit)}. Vui lòng gửi lý do bảo lãnh duyệt vượt trần.`,
          );
        }
        isCreditOverride = true;
        creditOverrideStatus = "PENDING";
      }

      // 1. Create the Order in DB
      const order = await tx.order.create({
        data: {
          status: OrderStatus.PENDING,
          userId: dbUser.id,
          customerId,
          localId,
          discountPercent,
          discountAmount: new Prisma.Decimal(discountAmount),
          promotionNotes: input.promotionNotes
            ? String(input.promotionNotes).trim()
            : pricingResult.appliedRules.join(" | ") || null,
          totalLiters,
          drumDelivered,
          drumReturned,
          drumDepositAmount: new Prisma.Decimal(drumDepositTotal),
          isCreditOverride,
          creditOverrideReason,
          creditOverrideStatus,
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

      // 2. Automatically log Drum Transactions (ISSUE / RETURN)
      if (drumDelivered > 0) {
        await tx.drumTransaction.create({
          data: {
            customerId,
            orderId: order.id,
            type: "ISSUE",
            quantity: drumDelivered,
            userId: dbUser.id,
            signature: input.signature || null,
            signedBy: input.signedBy || null,
            notes: `Giao kèm đơn hàng #${order.id.slice(-6).toUpperCase()}`,
          },
        });
      }
      if (drumReturned > 0) {
        await tx.drumTransaction.create({
          data: {
            customerId,
            orderId: order.id,
            type: "RETURN",
            quantity: drumReturned,
            depositDeducted: new Prisma.Decimal(drumReturned * depositUnitPrice),
            userId: dbUser.id,
            signature: input.signature || null,
            signedBy: input.signedBy || null,
            notes: `Thu hồi cấn trừ cọc kèm đơn hàng #${order.id.slice(-6).toUpperCase()}`,
          },
        });
      }

      // 3. Update Customer outstanding drums & current debt
      const newOutstandingDrums = Math.max(0, customer.outstandingDrums + netDrumChange);
      // If credit override is PENDING, do not increment customer debt until approved by Director!
      const newDebt = creditOverrideStatus === "PENDING"
        ? currentDebt
        : currentDebt + finalTotal;

      await tx.customer.update({
        where: { id: customerId },
        data: {
          outstandingDrums: newOutstandingDrums,
          currentDebt: new Prisma.Decimal(newDebt),
        },
      });

      // 4. Decrement product stock
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
      : input.isCreditOverride
      ? "Đơn hàng vượt hạn mức đã lưu và gửi Ban Giám Đốc phê duyệt khẩn cấp."
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

  let dbUser;
  try {
    dbUser = await requireRoles(["ADMIN", "ACCOUNTANT", "SALES", "FLEET"]);
  } catch (authErr: any) {
    return fail(authErr.message);
  }

  if (dbUser.role === "FLEET" && (nextStatus === OrderStatus.PENDING || nextStatus === OrderStatus.CONFIRMED)) {
    return fail("Đội xe chỉ được phép cập nhật trạng thái vận chuyển (Giao hàng và Hoàn thành).");
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
      return fail("Chỉ được chuyển giữa Chờ duyệt, Xuất kho, Giao hàng và Hoàn thành.");
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

  let dbUser;
  try {
    dbUser = await requireRoles(["ADMIN", "ACCOUNTANT", "SALES"]);
  } catch (authErr: any) {
    return fail(authErr.message);
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

/**
 * Ban Giám Đốc (ADMIN) phê duyệt đơn hàng bảo lãnh vượt hạn mức công nợ
 */
export async function approveCreditOverride(orderId: string): Promise<OrderActionResult> {
  if (!orderId) {
    return fail("Thiếu mã đơn hàng.");
  }

  const { dbUser } = await getSessionDbUser();
  if (!dbUser) {
    return fail("Bạn cần đăng nhập để phê duyệt.");
  }
  if (dbUser.role !== "ADMIN") {
    return fail("Chỉ Ban Giám Đốc (ADMIN) mới có quyền phê duyệt bảo lãnh vượt trần.");
  }

  try {
    await prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: { items: true, customer: true },
      });
      if (!order) {
        throw new Error("Không tìm thấy đơn hàng.");
      }
      if (order.creditOverrideStatus !== "PENDING") {
        throw new Error("Đơn hàng không ở trạng thái chờ duyệt bảo lãnh.");
      }

      const rawTotal = orderTotal(order.items);
      const netPayable = Math.max(
        0,
        rawTotal - Number(order.discountAmount) + Number(order.drumDepositAmount),
      );

      await tx.order.update({
        where: { id: orderId },
        data: {
          status: OrderStatus.CONFIRMED,
          creditOverrideStatus: "APPROVED",
          creditOverrideApprovedBy: dbUser.name || dbUser.email,
        },
      });

      await tx.customer.update({
        where: { id: order.customerId },
        data: {
          currentDebt: { increment: netPayable },
          creditOverridden: true,
          creditOverrideApprovedBy: dbUser.name || dbUser.email,
        },
      });
    });
  } catch (error) {
    return fail(
      error instanceof Error
        ? error.message
        : "Không thể phê duyệt đơn bảo lãnh. Vui lòng thử lại.",
    );
  }

  revalidateOrderPaths();
  return ok("Ban Giám Đốc đã phê duyệt bảo lãnh thành công! Đơn hàng đã được chuyển sang Xuất kho.");
}

/**
 * Ban Giám Đốc từ chối đơn hàng vượt hạn mức công nợ
 */
export async function rejectCreditOverride(
  orderId: string,
  reason?: string,
): Promise<OrderActionResult> {
  if (!orderId) {
    return fail("Thiếu mã đơn hàng.");
  }

  const { dbUser } = await getSessionDbUser();
  if (!dbUser) {
    return fail("Bạn cần đăng nhập.");
  }
  if (dbUser.role !== "ADMIN") {
    return fail("Chỉ Ban Giám Đốc mới có quyền từ chối bảo lãnh.");
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

      await tx.order.update({
        where: { id: orderId },
        data: {
          status: OrderStatus.CANCELLED,
          creditOverrideStatus: "REJECTED",
          promotionNotes: reason
            ? `GĐ Từ chối bảo lãnh: ${reason}`
            : "Ban Giám Đốc từ chối bảo lãnh công nợ",
        },
      });

      // Restore product stock
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
        : "Không thể từ chối đơn bảo lãnh.",
    );
  }

  revalidateOrderPaths();
  return ok("Đã từ chối đơn hàng vượt trần và hoàn trả tồn kho sản phẩm.");
}

