import type { DebtAging } from "@/types";

export type CustomerDto = {
  id: string;
  name: string;
  phone: string | null;
  address: string | null;
  type: "GARAGE" | "FLEET";
  creditLimit: number;
  creditTermDays?: number;
  currentDebt: number;
  debtAging?: DebtAging;
  outstandingDrums: number;
  dealerTier?: "GOLD" | "SILVER" | "RETAIL";
  creditOverridden?: boolean;
  creditOverrideReason?: string | null;
  creditOverrideApprovedBy?: string | null;
  lat: number | null;
  lng: number | null;
  visitDay?: "T2" | "T3" | "T4" | "T5" | "T6" | "T7" | null;
  visitDays?: ("T2" | "T3" | "T4" | "T5" | "T6" | "T7")[] | null;
  visitDates?: string[];
  visitPlans?: Array<{
    id: string;
    visitDate: string;
    note?: string | null;
  }>;
  createdAt?: string;
  updatedAt?: string;
};

export const CUSTOMERS_QUERY_KEY = ["customers"] as const;

export async function fetchCustomers(): Promise<CustomerDto[]> {
  const res = await fetch("/api/customers", {
    method: "GET",
    credentials: "same-origin",
  });

  if (!res.ok) {
    throw new Error("Không tải được danh sách khách hàng.");
  }

  return res.json() as Promise<CustomerDto[]>;
}

export type CustomerTypeFilter = "all" | "GARAGE" | "FLEET";
export type CreditStatusFilter = "all" | "near_limit" | "ok";

export function isNearCreditLimit(
  currentDebt: number,
  creditLimit: number,
): boolean {
  if (creditLimit <= 0) return false;
  return currentDebt / creditLimit >= 0.8;
}

export function filterCustomers(
  customers: CustomerDto[],
  opts: {
    query: string;
    type: CustomerTypeFilter;
    credit: CreditStatusFilter;
  },
): CustomerDto[] {
  const q = opts.query.trim().toLowerCase();

  return customers.filter((customer) => {
    if (q) {
      const haystack = [
        customer.name,
        customer.phone ?? "",
        customer.address ?? "",
        customer.type,
      ]
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(q)) return false;
    }

    if (opts.type !== "all" && customer.type !== opts.type) return false;

    const near = isNearCreditLimit(customer.currentDebt, customer.creditLimit);
    if (opts.credit === "near_limit" && !near) return false;
    if (opts.credit === "ok" && near) return false;

    return true;
  });
}
