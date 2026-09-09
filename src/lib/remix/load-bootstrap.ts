import { listCustomers } from "@/lib/data/customers";
import {
  getDashboardOverview,
  type DashboardOverview,
} from "@/lib/data/dashboard";
import {
  getDrumStats,
  listDrumTransactions,
  type DrumStats,
} from "@/lib/data/drums";
import { listFleetVehicles } from "@/lib/data/fleet";
import { listOrders } from "@/lib/data/orders";
import { listProducts } from "@/lib/data/products";
import { listRfmSegments, type RfmOverview } from "@/lib/data/rfm";
import { prisma } from "@/lib/prisma";
import {
  mapCustomersWithRfm,
  mapDrumTransactionsWithNames,
  mapFleetVehicleDto,
  mapOrderDto,
  mapProductDto,
} from "@/lib/remix/mappers";
import type {
  Customer,
  DrumTransaction,
  FleetVehicle,
  Order,
  Product,
} from "@/types";
import type { UserRole } from "@prisma/client";

export type RemixStaffUser = {
  id: string;
  name: string | null;
  email: string;
  role: UserRole;
  createdAt: string;
};

export type RemixBootstrap = {
  products: Product[];
  customers: Customer[];
  orders: Order[];
  vehicles: FleetVehicle[];
  drumTransactions: DrumTransaction[];
  dashboard: DashboardOverview;
  drumStats: DrumStats;
  rfm: RfmOverview;
  staffUsers: RemixStaffUser[];
};

const fetchRemixBootstrap = async (): Promise<RemixBootstrap> => {
  // Batch 1: Customers & Products (2 queries)
  const [customerDtos, productDtos] = await Promise.all([
    listCustomers(),
    listProducts(),
  ]);

  // Batch 2: Orders, Fleet, Drum Transactions (3 queries)
  const [orderDtos, fleetDtos, drumTxns] = await Promise.all([
    listOrders(),
    listFleetVehicles(),
    listDrumTransactions(),
  ]);

  // Batch 3: Staff Users & Drum Stats (pass customerDtos to eliminate customer.aggregate) (2 queries)
  const [users, drumStats] = await Promise.all([
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    }),
    getDrumStats(customerDtos),
  ]);

  // Step 4: Pure In-Memory calculations for Dashboard & RFM (0 DB queries!)
  const dashboard = await getDashboardOverview(customerDtos, orderDtos);
  const rfm = await listRfmSegments(orderDtos, customerDtos);

  return {
    products: productDtos.map(mapProductDto),
    customers: mapCustomersWithRfm(customerDtos, rfm),
    orders: orderDtos.map(mapOrderDto),
    vehicles: fleetDtos.map(mapFleetVehicleDto),
    drumTransactions: mapDrumTransactionsWithNames(drumTxns, customerDtos),
    dashboard,
    drumStats,
    rfm,
    staffUsers: users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      createdAt: u.createdAt.toISOString(),
    })),
  };
};

export const loadRemixBootstrap = async (): Promise<RemixBootstrap> => {
  return fetchRemixBootstrap();
};
