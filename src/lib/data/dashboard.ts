import type { OrderStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { calculateDebtAging } from "@/lib/data/customers";

const REVENUE_STATUSES: OrderStatus[] = ["PENDING", "CONFIRMED", "SHIPPED"];
const CREDIT_ALERT_RATIO = 0.85;

const VISCOSITY_PALETTE = [
  "#F59E0B",
  "#3B82F6",
  "#06B6D4",
  "#8B5CF6",
  "#10B981",
  "#F43F5E",
  "#64748B",
];

export type DashboardKpis = {
  revenueMtd: number;
  revenuePrevMonth: number;
  revenueMomPct: number | null;
  litersMtd: number;
  nearLimitDebtSum: number;
  nearLimitCount: number;
};

export type MonthlyTrendPoint = {
  month: string;
  label: string;
  revenue: number;
  collection: number;
  liters: number;
  /** Triệu VND for chart Y axis */
  revenueTrieu: number;
  collectionTrieu: number;
};

export type ViscosityMixPoint = {
  name: string;
  liters: number;
  percent: number;
  color: string;
};

export type DebtAgingOverview = {
  totalDebt: number;
  current: number;
  overdue1_15: number;
  overdue16_30: number;
  badDebt: number;
  criticalCount: number;
  warningCount: number;
  safeCount: number;
};

export type DashboardOverview = {
  kpis: DashboardKpis;
  monthlyTrend: MonthlyTrendPoint[];
  viscosityMix: ViscosityMixPoint[];
  debtAging?: DebtAgingOverview;
  mtdYear: number;
};

type OrderItemWithProduct = {
  quantity: number;
  unitPrice: { toString(): string } | number;
  product: { volume: string | null; viscosity: string | null } | null;
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

function monthChartLabel(d: Date, isMtd: boolean): string {
  const base = `T${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getFullYear()).slice(2)}`;
  return isMtd ? `${base} (MTD)` : base;
}

function orderRevenue(items: { quantity: number; unitPrice: { toString(): string } | number }[]): number {
  return items.reduce(
    (sum, item) => sum + item.quantity * Number(item.unitPrice),
    0,
  );
}

/** Parse liters from Product.volume string; fallback heuristics by keywords. */
export function parseProductLiters(volume: string | null | undefined): number {
  if (!volume) return 0;
  const raw = volume.trim();
  const numMatch = raw.match(/(\d+(?:[.,]\d+)?)/);
  if (numMatch) {
    const n = Number(numMatch[1].replace(",", "."));
    if (Number.isFinite(n) && n > 0) return n;
  }
  const lower = raw.toLowerCase();
  if (lower.includes("200") || lower.includes("phuy")) return 200;
  if (lower.includes("18") || lower.includes("thùng") || lower.includes("thung"))
    return 18;
  if (lower.includes("4") || lower.includes("xô") || lower.includes("xo"))
    return 4;
  if (lower.includes("chai") || lower.includes("1l")) return 1;
  return 0;
}

function orderLiters(items: OrderItemWithProduct[]): number {
  return items.reduce((sum, item) => {
    const litersPerUnit = parseProductLiters(item.product?.volume ?? null);
    return sum + item.quantity * litersPerUnit;
  }, 0);
}

function toTrieu(vnd: number): number {
  return Math.round((vnd / 1_000_000) * 10) / 10;
}

export async function getDashboardOverview(): Promise<DashboardOverview> {
  const now = new Date();
  const mtdStart = startOfMonth(now);
  const prevStart = addMonths(mtdStart, -1);
  const seriesStart = addMonths(mtdStart, -5);

  const itemSelect = {
    quantity: true,
    unitPrice: true,
    product: { select: { volume: true, viscosity: true } },
  } as const;

  const [mtdOrders, prevOrders, seriesOrders, shippedSeries, customers] =
    await Promise.all([
      prisma.order.findMany({
        where: {
          status: { in: REVENUE_STATUSES },
          createdAt: { gte: mtdStart },
        },
        select: { items: { select: itemSelect } },
      }),
      prisma.order.findMany({
        where: {
          status: { in: REVENUE_STATUSES },
          createdAt: { gte: prevStart, lt: mtdStart },
        },
        select: { items: { select: itemSelect } },
      }),
      prisma.order.findMany({
        where: {
          status: { in: REVENUE_STATUSES },
          createdAt: { gte: seriesStart },
        },
        select: {
          createdAt: true,
          items: { select: itemSelect },
        },
      }),
      prisma.order.findMany({
        where: {
          status: "SHIPPED",
          createdAt: { gte: seriesStart },
        },
        select: {
          createdAt: true,
          items: { select: { quantity: true, unitPrice: true } },
        },
      }),
      prisma.customer.findMany({
        select: {
          id: true,
          name: true,
          currentDebt: true,
          creditLimit: true,
          creditTermDays: true,
          orders: {
            where: { status: { in: REVENUE_STATUSES } },
            orderBy: { createdAt: "desc" },
            select: {
              createdAt: true,
              discountAmount: true,
              discountPercent: true,
              items: { select: { quantity: true, unitPrice: true } },
            },
          },
        },
      }),
    ]);

  let totalDebt = 0;
  let currentAging = 0;
  let overdue1_15Aging = 0;
  let overdue16_30Aging = 0;
  let badDebtAging = 0;
  let criticalCount = 0;
  let warningCount = 0;
  let safeCount = 0;

  for (const c of customers) {
    const debt = Number(c.currentDebt);
    totalDebt += debt;
    const term = c.creditTermDays ?? 30;
    const orderSummaries = (c.orders || []).map((o) => {
      const raw = o.items.reduce((s, it) => s + it.quantity * Number(it.unitPrice), 0);
      const discAmt = Number(o.discountAmount) || 0;
      const discPct = o.discountPercent || 0;
      const disc = discAmt > 0 ? discAmt : (discPct > 0 ? (raw * discPct / 100) : 0);
      return { createdAt: o.createdAt, total: Math.max(0, raw - disc) };
    });

    const aging = calculateDebtAging(debt, term, orderSummaries);
    currentAging += aging.current;
    overdue1_15Aging += aging.overdue1_15;
    overdue16_30Aging += aging.overdue16_30;
    badDebtAging += aging.badDebt;
    if (aging.status === "critical") criticalCount++;
    else if (aging.status === "warning") warningCount++;
    else safeCount++;
  }

  const debtAgingOverview: DebtAgingOverview = {
    totalDebt,
    current: currentAging,
    overdue1_15: overdue1_15Aging,
    overdue16_30: overdue16_30Aging,
    badDebt: badDebtAging,
    criticalCount,
    warningCount,
    safeCount,
  };

  const revenueMtd = mtdOrders.reduce(
    (sum, order) => sum + orderRevenue(order.items),
    0,
  );
  const litersMtd = mtdOrders.reduce(
    (sum, order) => sum + orderLiters(order.items),
    0,
  );
  const revenuePrevMonth = prevOrders.reduce(
    (sum, order) => sum + orderRevenue(order.items),
    0,
  );
  const revenueMomPct =
    revenuePrevMonth > 0
      ? Math.round(
          ((revenueMtd - revenuePrevMonth) / revenuePrevMonth) * 1000,
        ) / 10
      : revenueMtd > 0
        ? null
        : 0;

  let nearLimitDebtSum = 0;
  let nearLimitCount = 0;
  for (const c of customers) {
    const debt = Number(c.currentDebt);
    const limit = Number(c.creditLimit);
    if (limit <= 0) continue;
    if (debt / limit >= CREDIT_ALERT_RATIO) {
      nearLimitDebtSum += debt;
      nearLimitCount += 1;
    }
  }

  type Acc = { revenue: number; collection: number; liters: number };
  const monthlyMap = new Map<string, Acc>();
  for (let i = 0; i < 6; i++) {
    const d = addMonths(seriesStart, i);
    monthlyMap.set(monthKey(d), { revenue: 0, collection: 0, liters: 0 });
  }

  for (const order of seriesOrders) {
    const key = monthKey(order.createdAt);
    const acc = monthlyMap.get(key);
    if (!acc) continue;
    acc.revenue += orderRevenue(order.items);
    acc.liters += orderLiters(order.items);
  }

  for (const order of shippedSeries) {
    const key = monthKey(order.createdAt);
    const acc = monthlyMap.get(key);
    if (!acc) continue;
    acc.collection += orderRevenue(order.items);
  }

  const monthlyTrend: MonthlyTrendPoint[] = [];
  for (let i = 0; i < 6; i++) {
    const d = addMonths(seriesStart, i);
    const key = monthKey(d);
    const acc = monthlyMap.get(key) ?? {
      revenue: 0,
      collection: 0,
      liters: 0,
    };
    const isMtd = i === 5;
    monthlyTrend.push({
      month: key,
      label: monthChartLabel(d, isMtd),
      revenue: acc.revenue,
      collection: acc.collection,
      liters: Math.round(acc.liters),
      revenueTrieu: toTrieu(acc.revenue),
      collectionTrieu: toTrieu(acc.collection),
    });
  }

  const viscosityLiters = new Map<string, number>();
  for (const order of mtdOrders) {
    for (const item of order.items) {
      const liters =
        item.quantity * parseProductLiters(item.product?.volume ?? null);
      if (liters <= 0) continue;
      const name = (item.product?.viscosity ?? "").trim() || "Khác";
      viscosityLiters.set(name, (viscosityLiters.get(name) ?? 0) + liters);
    }
  }

  const mixEntries = Array.from(viscosityLiters.entries())
    .map(([name, liters]) => ({ name, liters: Math.round(liters) }))
    .sort((a, b) => b.liters - a.liters);

  const mixTotal = mixEntries.reduce((s, e) => s + e.liters, 0) || 1;
  const viscosityMix: ViscosityMixPoint[] = mixEntries.map((entry, idx) => ({
    name: entry.name,
    liters: entry.liters,
    percent: Math.round((entry.liters / mixTotal) * 100),
    color: VISCOSITY_PALETTE[idx % VISCOSITY_PALETTE.length],
  }));

  return {
    kpis: {
      revenueMtd,
      revenuePrevMonth,
      revenueMomPct,
      litersMtd: Math.round(litersMtd),
      nearLimitDebtSum,
      nearLimitCount,
    },
    monthlyTrend,
    viscosityMix,
    debtAging: debtAgingOverview,
    mtdYear: now.getFullYear(),
  };
}
