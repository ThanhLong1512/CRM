"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { OfflineBanner } from "@/components/features/OfflineBanner";
import { SidebarNav } from "@/components/features/SidebarNav";
import { getNavTitle } from "@/components/features/nav-config";

type AdminShellProps = {
  children: ReactNode;
  userRole: string;
  userName?: string | null;
  userEmail?: string | null;
};

export function AdminShell({
  children,
  userRole,
  userName,
  userEmail,
}: AdminShellProps) {
  const pathname = usePathname();
  const title = getNavTitle(pathname, userRole);
  const displayName = userName?.trim() || "User";
  const displayEmail = userEmail?.trim() || "—";
  const initials = displayName
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("") || "U";

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-muted/30 md:flex">
        <div className="flex h-14 items-center border-b border-border px-5">
          <Link
            href="/dashboard"
            className="text-sm font-semibold tracking-tight"
          >
            crm-dauan
          </Link>
        </div>
        <SidebarNav userRole={userRole} variant="desktop" />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-10 flex h-14 items-center justify-between gap-4 border-b border-border bg-background/95 px-4 backdrop-blur md:px-6">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold tracking-tight">
              {title}
            </p>
            <p className="hidden text-xs text-muted-foreground sm:block">
              Hệ thống CRM / DMS dầu nhớt
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium leading-none">{displayName}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {displayEmail}
              </p>
            </div>
            <div
              className="flex size-9 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground"
              aria-label="User profile"
            >
              {initials}
            </div>
          </div>
        </header>

        <div className="border-b border-border md:hidden">
          <SidebarNav userRole={userRole} variant="mobile" />
        </div>

        <OfflineBanner />

        <main className="flex-1 overflow-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
