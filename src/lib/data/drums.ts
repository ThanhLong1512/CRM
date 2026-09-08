import { prisma } from "@/lib/prisma";

export type DrumBalanceDto = {
  customerId: string;
  customerName: string;
  customerPhone: string | null;
  customerType: "GARAGE" | "FLEET";
  outstandingDrums: number;
  lastTxnAt: string | null;
  lastTxnType: "ISSUE" | "RETURN" | "ADJUST" | null;
};

export type DrumTxnDto = {
  id: string;
  customerId: string;
  type: "ISSUE" | "RETURN" | "ADJUST";
  quantity: number;
  productId: string | null;
  productName: string | null;
  productSku: string | null;
  notes: string | null;
  userName: string | null;
  createdAt: string;
};

export type DrumProductOption = {
  id: string;
  sku: string;
  name: string;
};

export type DrumCustomerOption = {
  id: string;
  name: string;
  phone: string | null;
  type: "GARAGE" | "FLEET";
  outstandingDrums: number;
};

export type DrumStats = {
  totalOutstanding: number;
  customersHolding: number;
  totalIssued: number;
  totalReturned: number;
  issuedMtd: number;
  returnedMtd: number;
};

export async function listDrumBalances(): Promise<DrumBalanceDto[]> {
  const customers = await prisma.customer.findMany({
    orderBy: [{ outstandingDrums: "desc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      phone: true,
      type: true,
      outstandingDrums: true,
      drumTransactions: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { createdAt: true, type: true },
      },
    },
  });

  return customers.map((c) => {
    const last = c.drumTransactions[0];
    return {
      customerId: c.id,
      customerName: c.name,
      customerPhone: c.phone,
      customerType: c.type,
      outstandingDrums: c.outstandingDrums,
      lastTxnAt: last?.createdAt.toISOString() ?? null,
      lastTxnType: last?.type ?? null,
    };
  });
}

export async function listDrumTransactions(
  customerId?: string,
): Promise<DrumTxnDto[]> {
  const rows = await prisma.drumTransaction.findMany({
    where: customerId ? { customerId } : undefined,
    orderBy: { createdAt: "desc" },
    take: customerId ? 100 : 200,
    include: {
      product: { select: { name: true, sku: true } },
      user: { select: { name: true, email: true } },
    },
  });

  return rows.map((row) => ({
    id: row.id,
    customerId: row.customerId,
    type: row.type,
    quantity: row.quantity,
    productId: row.productId,
    productName: row.product?.name ?? null,
    productSku: row.product?.sku ?? null,
    notes: row.notes,
    userName: row.user.name ?? row.user.email,
    createdAt: row.createdAt.toISOString(),
  }));
}

export async function listDrumProducts(): Promise<DrumProductOption[]> {
  return prisma.product.findMany({
    where: { isDrum: true },
    orderBy: { name: "asc" },
    select: { id: true, sku: true, name: true },
  });
}

export async function listDrumCustomers(): Promise<DrumCustomerOption[]> {
  return prisma.customer.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      phone: true,
      type: true,
      outstandingDrums: true,
    },
  });
}

export async function getDrumStats(): Promise<DrumStats> {
  const mtdStart = new Date(
    new Date().getFullYear(),
    new Date().getMonth(),
    1,
    0,
    0,
    0,
    0,
  );

  const [agg, issued, returned, issuedMtd, returnedMtd] = await Promise.all([
    prisma.customer.aggregate({
      _sum: { outstandingDrums: true },
      _count: {
        _all: true,
      },
      where: { outstandingDrums: { gt: 0 } },
    }),
    prisma.drumTransaction.aggregate({
      where: { type: "ISSUE" },
      _sum: { quantity: true },
    }),
    prisma.drumTransaction.aggregate({
      where: { type: "RETURN" },
      _sum: { quantity: true },
    }),
    prisma.drumTransaction.aggregate({
      where: { type: "ISSUE", createdAt: { gte: mtdStart } },
      _sum: { quantity: true },
    }),
    prisma.drumTransaction.aggregate({
      where: { type: "RETURN", createdAt: { gte: mtdStart } },
      _sum: { quantity: true },
    }),
  ]);

  return {
    totalOutstanding: agg._sum.outstandingDrums ?? 0,
    customersHolding: agg._count._all,
    totalIssued: issued._sum.quantity ?? 0,
    totalReturned: returned._sum.quantity ?? 0,
    issuedMtd: issuedMtd._sum.quantity ?? 0,
    returnedMtd: returnedMtd._sum.quantity ?? 0,
  };
}
