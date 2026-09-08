import RemixAppContainer from "@/components/remix/RemixAppContainer";
import { sessionToAuthUserProfile } from "@/components/auth/authData";
import { getSessionDbUser } from "@/lib/auth";
import { loadRemixBootstrap } from "@/lib/remix/load-bootstrap";
import type { NavigationModule } from "@/types";

export async function RemixModulePage({
  module,
}: {
  module: NavigationModule;
}) {
  const [data, session] = await Promise.all([
    loadRemixBootstrap(),
    getSessionDbUser(),
  ]);

  const sessionUser = session.dbUser
    ? sessionToAuthUserProfile(session.dbUser)
    : null;

  return (
    <RemixAppContainer
      initialModule={module}
      initialProducts={data.products}
      initialCustomers={data.customers}
      initialOrders={data.orders}
      initialVehicles={data.vehicles}
      initialDrumTransactions={data.drumTransactions}
      dashboard={data.dashboard}
      drumStats={data.drumStats}
      rfm={data.rfm}
      staffUsers={data.staffUsers}
      sessionUser={sessionUser}
    />
  );
}
