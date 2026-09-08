import { prisma } from "@/lib/prisma";
import type { OrderDto } from "@/app/(private)/don-hang/order-query";

export async function listOrders(): Promise<OrderDto[]> {
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      customer: { select: { id: true, name: true, type: true } },
      user: { select: { name: true, email: true } },
      items: {
        include: {
          product: { select: { id: true, name: true, sku: true } },
        },
      },
    },
  });

  return orders.map((order) => {
    const items = order.items.map((item) => {
      const unitPrice = Number(item.unitPrice);
      return {
        id: item.id,
        productId: item.productId,
        productName: item.product.name,
        productSku: item.product.sku,
        quantity: item.quantity,
        unitPrice,
        lineTotal: unitPrice * item.quantity,
      };
    });

    const rawTotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
    const discountAmount = Number(order.discountAmount) || 0;
    const discountPercent = order.discountPercent || 0;
    const computedDiscount = discountAmount > 0 
      ? discountAmount 
      : (discountPercent > 0 ? (rawTotal * discountPercent / 100) : 0);
    const total = Math.max(0, rawTotal - computedDiscount);

    return {
      id: order.id,
      status: order.status,
      customerId: order.customerId,
      customerName: order.customer.name,
      customerType: order.customer.type,
      userName: order.user.name,
      userEmail: order.user.email,
      total,
      rawTotal,
      discountPercent: order.discountPercent,
      discountAmount: Number(order.discountAmount),
      promotionNotes: order.promotionNotes,
      totalLiters: order.totalLiters,
      itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
      items,
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
    };
  });
}
