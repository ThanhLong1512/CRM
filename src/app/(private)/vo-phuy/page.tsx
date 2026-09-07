import { VoPhuyPageClient } from "@/app/(private)/vo-phuy/VoPhuyPageClient";
import {
  getDrumStats,
  listDrumBalances,
  listDrumCustomers,
  listDrumProducts,
} from "@/lib/data/drums";

export const dynamic = "force-dynamic";

export default async function VoPhuyPage() {
  const [balances, customers, products, stats] = await Promise.all([
    listDrumBalances(),
    listDrumCustomers(),
    listDrumProducts(),
    getDrumStats(),
  ]);

  return (
    <VoPhuyPageClient
      balances={balances}
      customers={customers}
      products={products}
      stats={stats}
    />
  );
}
