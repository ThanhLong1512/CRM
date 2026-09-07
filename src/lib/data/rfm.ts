import type { OrderStatus } from "@prisma/client";
import {
  assignRfmSegment,
  RFM_SEGMENTS,
  RFM_WINDOW_DAYS,
  rfmSegmentSortRank,
  scoreQuintiles,
  type RfmSegment,
} from "@/lib/rfm-status";
import { prisma } from "@/lib/prisma";

const SOLD_STATUSES: OrderStatus[] = ["PENDING", "CONFIRMED", "SHIPPED"];
const MS_PER_DAY = 24 * 60 * 60 * 1000;

export type RfmCustomerDto = {
  customerId: string;
  customerName: string;
  customerType: "GARAGE" | "FLEET";
  recencyDays: number;
  frequency: number;
  monetary: number;
  r: number;
  f: number;
  m: number;
  segment: RfmSegment;
};

export type RfmOverview = {
  windowDays: number;
  customers: RfmCustomerDto[];
  segmentCounts: Record<RfmSegment, number>;
};

function orderRevenue(
  items: { quantity: number; unitPrice: { toString(): string } | number }[],
): number {
  return items.reduce(
    (sum, item) => sum + item.quantity * Number(item.unitPrice),
    0,
  );
}

export async function listRfmSegments(): Promise<RfmOverview> {
  const now = new Date();
  const windowStart = new Date(
    now.getTime() - RFM_WINDOW_DAYS * MS_PER_DAY,
  );

  const orders = await prisma.order.findMany({
    where: {
      status: { in: SOLD_STATUSES },
      createdAt: { gte: windowStart },
    },
    select: {
      customerId: true,
      createdAt: true,
      customer: { select: { id: true, name: true, type: true } },
      items: { select: { quantity: true, unitPrice: true } },
    },
  });

  type Acc = {
    customerId: string;
    customerName: string;
    customerType: "GARAGE" | "FLEET";
    lastOrderAt: Date;
    frequency: number;
    monetary: number;
  };

  const byCustomer = new Map<string, Acc>();

  for (const order of orders) {
    const existing = byCustomer.get(order.customerId);
    const revenue = orderRevenue(order.items);
    if (!existing) {
      byCustomer.set(order.customerId, {
        customerId: order.customer.id,
        customerName: order.customer.name,
        customerType: order.customer.type,
        lastOrderAt: order.createdAt,
        frequency: 1,
        monetary: revenue,
      });
    } else {
      existing.frequency += 1;
      existing.monetary += revenue;
      if (order.createdAt > existing.lastOrderAt) {
        existing.lastOrderAt = order.createdAt;
      }
    }
  }

  const rows = Array.from(byCustomer.values());
  const recencyDays = rows.map((row) =>
    Math.max(
      0,
      Math.floor((now.getTime() - row.lastOrderAt.getTime()) / MS_PER_DAY),
    ),
  );
  const frequencies = rows.map((row) => row.frequency);
  const monetaries = rows.map((row) => row.monetary);

  // Recency: lower days = better → invert
  const rScores = scoreQuintiles(recencyDays, { invert: true });
  const fScores = scoreQuintiles(frequencies);
  const mScores = scoreQuintiles(monetaries);

  const segmentCounts: Record<RfmSegment, number> = {
    VIP: 0,
    CHURN_RISK: 0,
    POTENTIAL: 0,
    NEW_LOW: 0,
    STABLE: 0,
  };

  const customers: RfmCustomerDto[] = rows.map((row, i) => {
    const r = rScores[i];
    const f = fScores[i];
    const m = mScores[i];
    const segment = assignRfmSegment({ r, f, m });
    segmentCounts[segment] += 1;
    return {
      customerId: row.customerId,
      customerName: row.customerName,
      customerType: row.customerType,
      recencyDays: recencyDays[i],
      frequency: row.frequency,
      monetary: row.monetary,
      r,
      f,
      m,
      segment,
    };
  });

  customers.sort((a, b) => {
    const rankDiff =
      rfmSegmentSortRank(a.segment) - rfmSegmentSortRank(b.segment);
    if (rankDiff !== 0) return rankDiff;
    return b.monetary - a.monetary;
  });

  // Ensure all keys present for UI even if empty
  for (const seg of RFM_SEGMENTS) {
    segmentCounts[seg] = segmentCounts[seg] ?? 0;
  }

  return {
    windowDays: RFM_WINDOW_DAYS,
    customers,
    segmentCounts,
  };
}
