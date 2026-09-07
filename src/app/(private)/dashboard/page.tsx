import { DashboardPageClient } from "@/app/(private)/dashboard/DashboardPageClient";
import { getDashboardOverview } from "@/lib/data/dashboard";
import { listHungerAlerts } from "@/lib/data/hunger";
import { listRfmSegments } from "@/lib/data/rfm";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [overview, hungerAlerts, rfm] = await Promise.all([
    getDashboardOverview(),
    listHungerAlerts(),
    listRfmSegments(),
  ]);

  return (
    <DashboardPageClient
      overview={overview}
      hungerAlerts={hungerAlerts}
      rfm={rfm}
    />
  );
}
