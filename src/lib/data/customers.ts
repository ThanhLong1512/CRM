import { prisma } from "@/lib/prisma";
import type { CustomerDto } from "@/app/(private)/khach-hang/customer-query";

export async function listCustomers(): Promise<CustomerDto[]> {
  const customers = await prisma.customer.findMany({
    orderBy: { name: "asc" },
  });

  return customers.map((customer) => ({
    id: customer.id,
    name: customer.name,
    phone: customer.phone,
    address: customer.address,
    type: customer.type,
    creditLimit: Number(customer.creditLimit),
    currentDebt: Number(customer.currentDebt),
    outstandingDrums: customer.outstandingDrums,
    lat: customer.lat != null ? Number(customer.lat) : null,
    lng: customer.lng != null ? Number(customer.lng) : null,
    createdAt: customer.createdAt.toISOString(),
    updatedAt: customer.updatedAt.toISOString(),
  }));
}
