import { FleetPageClient } from "@/app/(private)/fleet/FleetPageClient";
import { listFleetCustomers, listFleetVehicles } from "@/lib/data/fleet";

export const dynamic = "force-dynamic";

export default async function FleetPage() {
  const [vehicles, customers] = await Promise.all([
    listFleetVehicles(),
    listFleetCustomers(),
  ]);

  return (
    <FleetPageClient
      vehicles={vehicles}
      customers={customers.map((c) => ({ id: c.id, name: c.name }))}
    />
  );
}
