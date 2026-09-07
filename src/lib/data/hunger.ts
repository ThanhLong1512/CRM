import type { OrderStatus } from "@prisma/client";
import {
  computeAvgCycleDays,
  computeHungerStatus,
  type HungerAlertLevel,
} from "@/lib/hunger-status";
import { prisma } from "@/lib/prisma";

const SOLD_STATUSES: OrderStatus[] = ["PENDING", "CONFIRMED", "SHIPPED"];

export type HungerAlertDto = {
  customerId: string;
  customerName: string;
  customerPhone: string | null;
  lastOrderAt: string;
  avgCycleDays: number;
  daysSinceLast: number;
  remaining: number;
  percent: number;
  level: HungerAlertLevel;
  overdue: boolean;
  expectedNextAt: string;
  topSku: string | null;
  topProductName: string | null;
  lastCheckInAt: string | null;
};

export async function listHungerAlerts(): Promise<HungerAlertDto[]> {
  const garages = await prisma.customer.findMany({
    where: { type: "GARAGE" },
    select: {
      id: true,
      name: true,
      phone: true,
      orders: {
        where: { status: { in: SOLD_STATUSES } },
        orderBy: { createdAt: "asc" },
        select: {
          createdAt: true,
          items: {
            select: {
              quantity: true,
              product: { select: { sku: true, name: true } },
            },
          },
        },
      },
      checkIns: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { createdAt: true },
      },
    },
  });

  const now = new Date();
  const alerts: HungerAlertDto[] = [];

  for (const garage of garages) {
    if (garage.orders.length === 0) continue;

    const dates = garage.orders.map((o) => o.createdAt);
    const lastOrderAt = dates[dates.length - 1];
    const avgCycleDays = computeAvgCycleDays(dates);
    const status = computeHungerStatus({
      lastOrderAt,
      avgCycleDays,
      now,
    });

    if (status.level === "GREEN") continue;

    const qtyBySku = new Map<
      string,
      { sku: string; name: string; qty: number }
    >();
    // Weight recent orders more: only last 3 orders for top SKU
    const recentOrders = garage.orders.slice(-3);
    for (const order of recentOrders) {
      for (const item of order.items) {
        const key = item.product.sku;
        const prev = qtyBySku.get(key);
        if (prev) {
          prev.qty += item.quantity;
        } else {
          qtyBySku.set(key, {
            sku: item.product.sku,
            name: item.product.name,
            qty: item.quantity,
          });
        }
      }
    }
    const top = Array.from(qtyBySku.values()).sort((a, b) => b.qty - a.qty)[0];

    alerts.push({
      customerId: garage.id,
      customerName: garage.name,
      customerPhone: garage.phone,
      lastOrderAt: lastOrderAt.toISOString(),
      avgCycleDays: status.avgCycleDays,
      daysSinceLast: status.daysSinceLast,
      remaining: status.remaining,
      percent: status.percent,
      level: status.level,
      overdue: status.overdue,
      expectedNextAt: status.expectedNextAt.toISOString(),
      topSku: top?.sku ?? null,
      topProductName: top?.name ?? null,
      lastCheckInAt: garage.checkIns[0]?.createdAt.toISOString() ?? null,
    });
  }

  alerts.sort((a, b) => {
    if (a.level !== b.level) return a.level === "RED" ? -1 : 1;
    return a.remaining - b.remaining;
  });

  return alerts;
}
