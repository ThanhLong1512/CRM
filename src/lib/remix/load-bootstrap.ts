import { cache } from "react";
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

export const loadRemixBootstrap = cache(async (): Promise<RemixBootstrap> => {
  const [
    productDtos,
    customerDtos,
    orderDtos,
    fleetDtos,
    drumTxns,
    dashboard,
    drumStats,
    rfm,
    users,
  ] = await Promise.all([
    listProducts(),
    listCustomers(),
    listOrders(),
    listFleetVehicles(),
    listDrumTransactions(),
    getDashboardOverview(),
    getDrumStats(),
    listRfmSegments(),
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
  ]);

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
});
