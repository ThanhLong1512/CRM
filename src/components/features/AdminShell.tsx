"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Flame, Menu, X } from "lucide-react";
import { OfflineBanner } from "@/components/features/OfflineBanner";
import { SidebarNav } from "@/components/features/SidebarNav";
import { getNavTitle } from "@/components/features/nav-config";
import { Button } from "@/components/ui/button";

type AdminShellProps = {
  children: ReactNode;
  userRole: string;
  userName?: string | null;
  userEmail?: string | null;
};

function BrandBlock({ onClose }: { onClose?: () => void }) {
  return (
    <div className="flex items-center justify-between border-b border-slate-800/80 bg-[#0F172A] p-4">
      <Link href="/dashboard" className="flex items-center gap-2.5" onClick={onClose}>
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-md shadow-amber-900/30">
          <Flame className="size-5 fill-white/20" aria-hidden />
        </div>
        <div>
          <div className="font-mono text-[10px] font-bold tracking-wider text-amber-500 uppercase">
            Lubricants CRM & DMS
          </div>
          <div className="text-sm leading-tight font-bold tracking-tight text-white">
            Dầu Nhớt &amp; Phụ Tùng
          </div>
        </div>
      </Link>
      {onClose ? (
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
          aria-label="Đóng menu"
        >
          <X className="size-5" />
        </button>
      ) : null}
    </div>
  );
}

function SidebarChrome({
  userRole,
  onNavigate,
}: {
  userRole: string;
  onNavigate?: () => void;
}) {
  return (
    <div className="flex h-full flex-col justify-between">
      <div className="flex flex-1 flex-col overflow-hidden">
        <BrandBlock onClose={onNavigate} />
        <div className="flex items-center gap-1.5 border-b border-slate-800/50 bg-[#0F172A]/50 px-4 py-2 text-[11px] text-slate-400">
          <span className="inline-block size-2 animate-pulse rounded-full bg-emerald-500" />
          <span>Chi nhánh Phía Nam · v2.5 Pro</span>
        </div>
        <SidebarNav userRole={userRole} variant="desktop" onNavigate={onNavigate} />
      </div>
      <div className="m-3 shrink-0 rounded-xl border border-slate-700/80 bg-slate-800/60 p-3 text-xs text-slate-300">
        <div className="mb-1 flex items-center justify-between font-semibold text-white">
          <span className="text-[11px]">Kho Tổng Bình Chánh</span>
          <span className="rounded bg-emerald-500/20 px-1.5 font-mono text-[10px] text-emerald-300">
            Sẵn sàng
          </span>
        </div>
        <div className="text-[11px] text-slate-400">QL1A, H. Bình Chánh, TP.HCM</div>
        <div className="mt-2 flex items-center justify-between border-t border-slate-700/60 pt-2 font-mono text-[10px] text-slate-400">
          <span>Hotline Kỹ thuật</span>
          <span className="font-bold text-amber-400">1900 6868</span>
        </div>
      </div>
    </div>
  );
}

export function AdminShell({
  children,
  userRole,
  userName,
  userEmail,
}: AdminShellProps) {
  const pathname = usePathname();
  const title = getNavTitle(pathname, userRole);
  const [mobileOpen, setMobileOpen] = useState(false);
  const displayName = userName?.trim() || "User";
  const displayEmail = userEmail?.trim() || "—";
  const initials =
    displayName
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "U";

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <aside className="sticky top-0 z-20 hidden h-screen w-64 shrink-0 flex-col border-r border-slate-800 bg-[#0F172A] text-slate-100 select-none lg:flex">
        <SidebarChrome userRole={userRole} />
      </aside>

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <button
            type="button"
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs"
            aria-label="Đóng backdrop"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative z-50 flex h-full w-72 max-w-[85vw] flex-col bg-[#0F172A] text-slate-100 shadow-2xl">
            <SidebarChrome
              userRole={userRole}
              onNavigate={() => setMobileOpen(false)}
            />
          </aside>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-slate-200 bg-white px-3 py-3 shadow-xs sm:px-6">
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="shrink-0 lg:hidden"
              onClick={() => setMobileOpen(true)}
              aria-label="Mở menu"
            >
              <Menu className="size-5" />
            </Button>
            <div className="min-w-0">
              <div className="hidden items-center gap-1.5 font-mono text-xs font-medium text-slate-400 md:flex">
                <span className="font-bold text-amber-600">DMS</span>
                <span>/</span>
                <span className="text-slate-600">crm-dauan</span>
                <span className="text-slate-300">|</span>
              </div>
              <h1 className="truncate font-display text-sm font-bold tracking-tight text-slate-900 sm:text-base md:text-lg">
                {title}
              </h1>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <div className="hidden border-l border-slate-200 pl-3 text-right sm:block">
              <p className="text-xs font-semibold text-slate-800">{displayName}</p>
              <p className="mt-0.5 text-[11px] text-slate-400">{displayEmail}</p>
            </div>
            <div
              className="flex size-8 items-center justify-center rounded-full bg-slate-900 font-mono text-xs font-bold text-amber-400 shadow-xs"
              aria-label="User profile"
            >
              {initials}
            </div>
          </div>
        </header>

        <OfflineBanner />

        <main className="flex-1 overflow-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
