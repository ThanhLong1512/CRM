import type { OrderStatus } from "@prisma/client";
import { isNearCreditLimit } from "@/app/(private)/khach-hang/customer-query";
import { prisma } from "@/lib/prisma";

const REVENUE_STATUSES: OrderStatus[] = ["PENDING", "CONFIRMED", "SHIPPED"];

export type DashboardKpis = {
  revenueMtd: number;
  orderCountMtd: number;
  totalDebt: number;
  nearLimitCount: number;
};

export type MonthlyRevenuePoint = {
  month: string; // YYYY-MM
  label: string; // e.g. Thg 4
  revenue: number;
};

export type TopDebtorDto = {
  id: string;
  name: string;
  currentDebt: number;
  creditLimit: number;
};

export type DashboardOverview = {
  kpis: DashboardKpis;
  statusCounts: Record<OrderStatus, number>;
  monthlyRevenue: MonthlyRevenuePoint[];
  topDebtors: TopDebtorDto[];
};

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0);
}

function addMonths(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth() + n, 1, 0, 0, 0, 0);
}

function monthKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

function monthLabel(d: Date): string {
  return `Thg ${d.getMonth() + 1}`;
}

function orderRevenue(
  items: { quantity: number; unitPrice: { toString(): string } | number }[],
): number {
  return items.reduce(
    (sum, item) => sum + item.quantity * Number(item.unitPrice),
    0,
  );
}

const EMPTY_STATUS_COUNTS: Record<OrderStatus, number> = {
  DRAFT: 0,
  PENDING: 0,
  CONFIRMED: 0,
  SHIPPED: 0,
  CANCELLED: 0,
};

export async function getDashboardOverview(): Promise<DashboardOverview> {
  const now = new Date();
  const mtdStart = startOfMonth(now);
  const seriesStart = addMonths(mtdStart, -5);

  const [mtdOrders, seriesOrders, statusGroups, debtAgg, customers] =
    await Promise.all([
      prisma.order.findMany({
        where: {
          status: { in: REVENUE_STATUSES },
          createdAt: { gte: mtdStart },
        },
        select: {
          id: true,
          items: { select: { quantity: true, unitPrice: true } },
        },
      }),
      prisma.order.findMany({
        where: {
          status: { in: REVENUE_STATUSES },
          createdAt: { gte: seriesStart },
        },
        select: {
          createdAt: true,
          items: { select: { quantity: true, unitPrice: true } },
        },
      }),
      prisma.order.groupBy({
        by: ["status"],
        _count: { _all: true },
      }),
      prisma.customer.aggregate({
        _sum: { currentDebt: true },
      }),
      prisma.customer.findMany({
        select: {
          id: true,
          name: true,
          currentDebt: true,
          creditLimit: true,
        },
      }),
    ]);

  const revenueMtd = mtdOrders.reduce(
    (sum, order) => sum + orderRevenue(order.items),
    0,
  );

  const monthlyMap = new Map<string, number>();
  for (let i = 0; i < 6; i++) {
    const d = addMonths(seriesStart, i);
    monthlyMap.set(monthKey(d), 0);
  }
  for (const order of seriesOrders) {
    const key = monthKey(order.createdAt);
    if (!monthlyMap.has(key)) continue;
    monthlyMap.set(
      key,
      (monthlyMap.get(key) ?? 0) + orderRevenue(order.items),
    );
  }

  const monthlyRevenue: MonthlyRevenuePoint[] = [];
  for (let i = 0; i < 6; i++) {
    const d = addMonths(seriesStart, i);
    const key = monthKey(d);
    monthlyRevenue.push({
      month: key,
      label: monthLabel(d),
      revenue: monthlyMap.get(key) ?? 0,
    });
  }

  const statusCounts: Record<OrderStatus, number> = { ...EMPTY_STATUS_COUNTS };
  for (const row of statusGroups) {
    statusCounts[row.status] = row._count._all;
  }

  let nearLimitCount = 0;
  const withDebt = customers.map((c) => {
    const currentDebt = Number(c.currentDebt);
    const creditLimit = Number(c.creditLimit);
    if (isNearCreditLimit(currentDebt, creditLimit)) nearLimitCount += 1;
    return {
      id: c.id,
      name: c.name,
      currentDebt,
      creditLimit,
    };
  });

  const topDebtors = withDebt
    .filter((c) => c.currentDebt > 0)
    .sort((a, b) => b.currentDebt - a.currentDebt)
    .slice(0, 5);

  return {
    kpis: {
      revenueMtd,
      orderCountMtd: mtdOrders.length,
      totalDebt: Number(debtAgg._sum.currentDebt ?? 0),
      nearLimitCount,
    },
    statusCounts,
    monthlyRevenue,
    topDebtors,
  };
}
