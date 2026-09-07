import { redirect } from "next/navigation";
import { getSessionDbUser, isAdminRole, resolveUserRole } from "@/lib/auth";

export default async function CauHinhPage() {
  const { dbUser } = await getSessionDbUser();
  const role = resolveUserRole(dbUser);

  if (!isAdminRole(role)) {
    redirect("/dashboard");
  }

  return (
    <div className="space-y-2">
      <h1 className="text-2xl font-semibold tracking-tight">Cấu hình</h1>
      <p className="text-muted-foreground">
        Cấu hình hệ thống CRM / DMS — placeholder.
      </p>
    </div>
  );
}
