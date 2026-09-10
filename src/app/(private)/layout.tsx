import type { ReactNode } from "react";
import { Suspense } from "react";
import { LoginSuccessToast } from "@/components/auth/LoginSuccessToast";

export default function PrivateLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      <Suspense fallback={null}>
        <LoginSuccessToast />
      </Suspense>
      {children}
    </div>
  );
}
