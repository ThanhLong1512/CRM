import AuthScreen from "@/components/auth/AuthScreen";
import { listQuickLoginUsers } from "@/lib/auth/quick-login-users";

export const dynamic = "force-dynamic";

export default async function RegisterPage() {
  const quickLoginUsers = await listQuickLoginUsers();
  return (
    <AuthScreen initialMode="register" quickLoginUsers={quickLoginUsers} />
  );
}
