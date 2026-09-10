"use client";

import { useState, useEffect, useTransition } from "react";
import {
  Wifi,
  CloudOff,
  RefreshCw,
  Menu,
  Zap,
  ShoppingBag,
  Layers,
  Users,
  Boxes,
  Truck,
  QrCode,
  Package,
  BarChart3,
  ChevronDown,
  ShieldCheck,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { ActionMenu } from "@/components/common/ActionMenu";
import { ThemeToggle } from "@/components/common/ThemeToggle";
import { LanguageToggle } from "@/components/common/LanguageToggle";
import { useTranslation } from "@/components/providers/language-provider";
import { logout } from "@/app/auth/actions";
import ChangePasswordModal from "@/components/auth/ChangePasswordModal";
import LogoutConfirmDialog from "@/components/auth/LogoutConfirmDialog";
import UserProfileModal from "@/components/auth/UserProfileModal";
import { ApprovalCenterModal } from "@/components/approval/ApprovalCenterModal";
import type { AuthUserProfile } from "@/components/auth/authData";
import { soundFX } from "@/components/utils/audio";
import AppLogo from "@/components/common/AppLogo";

interface HeaderProps {
  currentModuleName: string;
  sessionUser: AuthUserProfile;
  isOffline: boolean;
  onToggleOffline: () => void;
  offlineCount?: number;
  onSyncOffline?: () => void;
  onOpenMobileMenu?: () => void;
}

export default function Header({
  currentModuleName,
  sessionUser,
  isOffline,
  onToggleOffline,
  offlineCount = 0,
  onSyncOffline,
  onOpenMobileMenu,
}: HeaderProps) {
  const { t } = useTranslation();
  const [profileOpen, setProfileOpen] = useState(false);
  const [changePwOpen, setChangePwOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [approvalOpen, setApprovalOpen] = useState(false);
  const [pendingApprovalCount, setPendingApprovalCount] = useState(0);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  useEffect(() => {
    const fetchPending = async () => {
      try {
        const res = await fetch("/api/approvals?status=PENDING", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          setPendingApprovalCount(data.pendingCount || 0);
        }
      } catch {
        // ignore
      }
    };
    void fetchPending();
    const interval = setInterval(fetchPending, 15000);
    return () => clearInterval(interval);
  }, []);

  const initials = sessionUser.name
    .split(" ")
    .map((n) => n[0])
    .slice(-2)
    .join("")
    .toUpperCase();

  const confirmLogout = () => {
    startTransition(async () => {
      await logout();
    });
  };

  return (
    <>
      <header
        id="app-header"
        className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xs px-3 py-3 shadow-xs sm:px-6 transition-colors"
      >
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          {onOpenMobileMenu && (
            <button
              id="mobile-hamburger-btn"
              type="button"
              onClick={onOpenMobileMenu}
              className="-ml-1 shrink-0 cursor-pointer rounded-xl p-2 text-slate-700 dark:text-slate-300 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-950 dark:hover:text-white lg:hidden"
              title={t("openMenu")}
            >
              <Menu className="h-5 w-5" />
            </button>
          )}
          <div className="flex lg:hidden items-center shrink-0">
            <AppLogo variant="compact" />
          </div>
          <div className="flex min-w-0 items-center gap-2">
            <div className="hidden shrink-0 items-center gap-2 font-medium text-slate-400 md:flex">
              <AppLogo variant="header" />
              <span className="text-slate-300 dark:text-slate-700 font-light text-sm">/</span>
            </div>
            <h1 className="truncate text-sm font-bold tracking-tight text-slate-900 dark:text-slate-100 sm:text-base md:text-lg">
              {currentModuleName}
            </h1>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          {/* Quick Actions Global Launcher */}
          <ActionMenu
            align="end"
            variant="outline"
            menuClassName="min-w-[220px]"
            trigger={
              <button
                type="button"
                className="hidden sm:flex cursor-pointer items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-2.5 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 shadow-2xs hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                title={t("quickActionMenuTitle")}
              >
                <Zap className="size-3.5 text-amber-500 fill-amber-500" />
                <span>{t("quickActions")}</span>
                <ChevronDown className="size-3 text-slate-400" />
              </button>
            }
            items={[
              {
                label: t("qaSalesPwa"),
                icon: ShoppingBag,
                onClick: () => router.push("/sales"),
              },
              {
                label: t("qaKanban"),
                icon: Layers,
                onClick: () => router.push("/don-hang"),
              },
              {
                label: t("qaCustomers"),
                icon: Users,
                onClick: () => router.push("/khach-hang"),
              },
              {
                label: t("qaProducts"),
                icon: Boxes,
                onClick: () => router.push("/san-pham"),
              },
              {
                label: t("qaFleet"),
                icon: Truck,
                onClick: () => router.push("/fleet"),
              },
              {
                label: t("qaLoyalty"),
                icon: QrCode,
                onClick: () => router.push("/tich-diem"),
              },
              {
                label: t("qaDrums"),
                icon: Package,
                onClick: () => router.push("/vo-phuy"),
              },
              "separator",
              {
                label: t("qaDashboard"),
                icon: BarChart3,
                onClick: () => router.push("/dashboard"),
              },
            ]}
          />

          {offlineCount > 0 && (
            <button
              type="button"
              onClick={onSyncOffline}
              className="flex animate-pulse cursor-pointer items-center gap-1 rounded-lg border border-amber-300 bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-900 hover:bg-amber-100"
            >
              <RefreshCw className="h-3.5 w-3.5 animate-spin text-amber-600" />
              <span className="hidden sm:inline">{t("pendingSync")}</span>
              <strong>{offlineCount}</strong>
            </button>
          )}

          <button
            id="network-status-toggle"
            type="button"
            onClick={onToggleOffline}
            className={`flex cursor-pointer items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-xs font-semibold transition-all ${
              isOffline
                ? "border-amber-300 bg-amber-50 text-amber-900 shadow-xs"
                : "border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
            }`}
          >
            {isOffline ? (
              <>
                <CloudOff className="h-3.5 w-3.5 shrink-0 text-amber-700" />
                <span className="font-mono text-[11px] font-bold text-amber-800">
                  {t("networkOffline")}
                </span>
              </>
            ) : (
              <>
                <span className="h-2 w-2 shrink-0 animate-pulse rounded-full bg-emerald-500" />
                <Wifi className="hidden h-3.5 w-3.5 shrink-0 text-emerald-600 sm:inline" />
                <span className="font-mono text-[11px] font-bold text-emerald-800">
                  {t("networkOnline")}
                </span>
              </>
            )}
          </button>

          {/* Approval Center Trigger Button */}
          <button
            type="button"
            onClick={() => {
              soundFX.playClick();
              setApprovalOpen(true);
            }}
            title="Trung tâm phê duyệt tập trung"
            className="relative flex cursor-pointer items-center justify-center rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-2xs"
          >
            <ShieldCheck className="h-4 w-4 text-amber-500" />
            {pendingApprovalCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-black text-white shadow-sm animate-pulse">
                {pendingApprovalCount > 99 ? "99+" : pendingApprovalCount}
              </span>
            )}
          </button>

          {/* Language Switcher */}
          <LanguageToggle align="end" />

          {/* Theme Mode Switcher */}
          <ThemeToggle align="end" />

          <button
            type="button"
            onClick={() => {
              soundFX.playClick();
              setProfileOpen(true);
            }}
            className="flex cursor-pointer items-center gap-1.5 border-l border-slate-200 dark:border-slate-800 pl-2 sm:gap-2 sm:pl-3 transition-colors"
            title={t("profileAndLogout")}
          >
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-900 dark:bg-slate-800 font-mono text-xs font-bold text-amber-400 border border-slate-700 shadow-xs sm:h-8 sm:w-8">
              {initials || "U"}
            </div>
            <div className="hidden max-w-[140px] flex-col md:max-w-[200px] sm:flex text-left">
              <span className="text-[9px] leading-none font-medium text-slate-400 dark:text-slate-500">
                {t("userAccount")}
              </span>
              <span className="truncate text-xs font-semibold text-slate-800 dark:text-slate-200">
                {sessionUser.name}
              </span>
            </div>
          </button>
        </div>
      </header>

      <UserProfileModal
        isOpen={profileOpen}
        currentUser={sessionUser}
        onClose={() => setProfileOpen(false)}
        onOpenChangePassword={() => {
          setProfileOpen(false);
          setChangePwOpen(true);
        }}
        onRequestLogout={() => {
          setProfileOpen(false);
          setLogoutOpen(true);
        }}
      />

      <ChangePasswordModal
        isOpen={changePwOpen}
        userEmail={sessionUser.email}
        onClose={() => setChangePwOpen(false)}
        onSuccess={() => setChangePwOpen(false)}
      />

      <LogoutConfirmDialog
        isOpen={logoutOpen}
        currentUser={sessionUser}
        pendingOfflineCount={offlineCount}
        onClose={() => setLogoutOpen(false)}
        onConfirmLogout={confirmLogout}
      />

      <ApprovalCenterModal
        isOpen={approvalOpen}
        onClose={() => setApprovalOpen(false)}
        sessionRole={sessionUser.role}
        onSuccessAction={() => {
          fetch("/api/approvals?status=PENDING")
            .then((r) => r.json())
            .then((d) => setPendingApprovalCount(d.pendingCount || 0))
            .catch(() => {});
        }}
      />

      {pending && (
        <div className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex justify-center">
          <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white shadow-lg">
            Đang đăng xuất...
          </span>
        </div>
      )}
    </>
  );
}
