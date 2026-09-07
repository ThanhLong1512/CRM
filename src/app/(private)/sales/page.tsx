import { SalesPageClient } from "@/app/(private)/sales/SalesPageClient";
import { listTodayCheckIns } from "@/lib/data/check-ins";
import { listCustomers } from "@/lib/data/customers";

export default async function SalesPage() {
  const [customers, todayCheckIns] = await Promise.all([
    listCustomers(),
    listTodayCheckIns(),
  ]);

  return (
    <SalesPageClient customers={customers} todayCheckIns={todayCheckIns} />
  );
}
