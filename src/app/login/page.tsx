import AuthScreen from "@/components/auth/AuthScreen";
import { listQuickLoginUsers } from "@/lib/auth/quick-login-users";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const quickLoginUsers = await listQuickLoginUsers();
  return (
    <AuthScreen initialMode="login" quickLoginUsers={quickLoginUsers} />
  );
}
