import { prisma } from "@/lib/prisma";
import type { CustomerDto } from "@/app/(private)/khach-hang/customer-query";
import type { DebtAging } from "@/types";

export function calculateDebtAging(
  currentDebt: number,
  creditTermDays: number = 30,
  orders: { createdAt: Date; total: number }[] = [],
): DebtAging {
  if (currentDebt <= 0) {
    return {
      current: 0,
      overdue1_15: 0,
      overdue16_30: 0,
      badDebt: 0,
      maxOverdueDays: 0,
      status: "safe",
    };
  }

  const now = Date.now();
  let remainingDebt = currentDebt;
  let current = 0;
  let overdue1_15 = 0;
  let overdue16_30 = 0;
  let badDebt = 0;
  let maxOverdueDays = 0;

  // Sort orders oldest to newest for FIFO debt matching
  const sortedOrders = [...orders].sort(
    (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
  );

  for (const order of sortedOrders) {
    if (remainingDebt <= 0) break;
    const allocated = Math.min(remainingDebt, order.total);
    remainingDebt -= allocated;

    const ageDays = Math.max(
      0,
      Math.floor((now - order.createdAt.getTime()) / 86400000),
    );
    const overdueDays = Math.max(0, ageDays - creditTermDays);
    if (overdueDays > maxOverdueDays) {
      maxOverdueDays = overdueDays;
    }

    if (overdueDays <= 0) {
      current += allocated;
    } else if (overdueDays <= 15) {
      overdue1_15 += allocated;
    } else if (overdueDays <= 30) {
      overdue16_30 += allocated;
    } else {
      badDebt += allocated;
    }
  }

  if (remainingDebt > 0) {
    current += remainingDebt;
  }

  let status: "safe" | "warning" | "critical" = "safe";
  if (badDebt > 0 || maxOverdueDays > 30) {
    status = "critical";
  } else if (overdue16_30 > 0 || overdue1_15 > 0 || maxOverdueDays > 0) {
    status = "warning";
  }

  return {
    current,
    overdue1_15,
    overdue16_30,
    badDebt,
    maxOverdueDays,
    status,
  };
}

export async function listCustomers(): Promise<CustomerDto[]> {
  const customers = await prisma.customer.findMany({
    orderBy: { name: "asc" },
    include: {
      orders: {
        where: {
          status: { in: ["PENDING", "CONFIRMED", "SHIPPED"] },
        },
        orderBy: { createdAt: "desc" },
        select: {
          createdAt: true,
          discountAmount: true,
          discountPercent: true,
          items: {
            select: {
              quantity: true,
              unitPrice: true,
            },
          },
        },
      },
    },
  });

  return customers.map((customer) => {
    const currentDebt = Number(customer.currentDebt);
    const creditTermDays = customer.creditTermDays ?? 30;

    const orderSummaries = customer.orders.map((o) => {
      const raw = o.items.reduce(
        (sum, it) => sum + it.quantity * Number(it.unitPrice),
        0,
      );
      const discAmt = Number(o.discountAmount) || 0;
      const discPct = o.discountPercent || 0;
      const discount = discAmt > 0 ? discAmt : (discPct > 0 ? (raw * discPct / 100) : 0);
      return {
        createdAt: o.createdAt,
        total: Math.max(0, raw - discount),
      };
    });

    const debtAging = calculateDebtAging(currentDebt, creditTermDays, orderSummaries);

    return {
      id: customer.id,
      name: customer.name,
      phone: customer.phone,
      address: customer.address,
      type: customer.type,
      creditLimit: Number(customer.creditLimit),
      creditTermDays,
      currentDebt,
      debtAging,
      outstandingDrums: customer.outstandingDrums,
      dealerTier: customer.dealerTier,
      creditOverridden: customer.creditOverridden,
      creditOverrideReason: customer.creditOverrideReason,
      creditOverrideApprovedBy: customer.creditOverrideApprovedBy,
      lat: customer.lat != null ? Number(customer.lat) : null,
      lng: customer.lng != null ? Number(customer.lng) : null,
      visitDay: customer.visitDay,
      visitDays: customer.visitDays
        ? (customer.visitDays.split(",").filter(Boolean) as ("T2" | "T3" | "T4" | "T5" | "T6" | "T7")[])
        : customer.visitDay
          ? [customer.visitDay]
          : [],
      createdAt: customer.createdAt.toISOString(),
      updatedAt: customer.updatedAt.toISOString(),
    };
  });
}
