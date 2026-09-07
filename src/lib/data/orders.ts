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

    const total = items.reduce((sum, item) => sum + item.lineTotal, 0);

    return {
      id: order.id,
      status: order.status,
      customerId: order.customerId,
      customerName: order.customer.name,
      customerType: order.customer.type,
      userName: order.user.name,
      userEmail: order.user.email,
      total,
      itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
      items,
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
    };
  });
}
