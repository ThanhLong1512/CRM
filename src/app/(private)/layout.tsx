import type { ReactNode } from "react";
import { AdminShell } from "@/components/features/AdminShell";
import { getSessionDbUser, resolveUserRole } from "@/lib/auth";

export default async function PrivateLayout({
  children,
}: {
  children: ReactNode;
}) {
  const { dbUser } = await getSessionDbUser();
  const userRole = resolveUserRole(dbUser);

  return (
    <AdminShell
      userRole={userRole}
      userName={dbUser?.name}
      userEmail={dbUser?.email}
    >
      {children}
    </AdminShell>
  );
}
