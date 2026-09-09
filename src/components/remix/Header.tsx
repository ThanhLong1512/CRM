"use client";

import { useState, useTransition } from "react";
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
} from "lucide-react";
import { useRouter } from "next/navigation";
import { ActionMenu } from "@/components/common/ActionMenu";
import { logout } from "@/app/auth/actions";
import ChangePasswordModal from "@/components/auth/ChangePasswordModal";
import LogoutConfirmDialog from "@/components/auth/LogoutConfirmDialog";
import UserProfileModal from "@/components/auth/UserProfileModal";
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
  const [profileOpen, setProfileOpen] = useState(false);
  const [changePwOpen, setChangePwOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

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
        className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200 bg-white px-3 py-3 shadow-xs sm:px-6"
      >
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          {onOpenMobileMenu && (
            <button
              id="mobile-hamburger-btn"
              type="button"
              onClick={onOpenMobileMenu}
              className="-ml-1 shrink-0 cursor-pointer rounded-xl p-2 text-slate-700 transition-colors hover:bg-slate-100 hover:text-slate-950 lg:hidden"
              title="Mở menu"
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
              <span className="text-slate-300 font-light text-sm">/</span>
            </div>
            <h1 className="truncate text-sm font-bold tracking-tight text-slate-900 sm:text-base md:text-lg">
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
                className="hidden sm:flex cursor-pointer items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 transition-colors"
                title="Mở danh mục thao tác nhanh toàn hệ thống"
              >
                <Zap className="size-3.5 text-amber-500 fill-amber-500" />
                <span>Thao tác nhanh</span>
                <ChevronDown className="size-3 text-slate-400" />
              </button>
            }
            items={[
              {
                label: "Lên đơn bán hàng (Sales PWA)",
                icon: ShoppingBag,
                onClick: () => router.push("/sales"),
              },
              {
                label: "Bàn điều phối Kanban",
                icon: Layers,
                onClick: () => router.push("/don-hang"),
              },
              {
                label: "Quản lý khách hàng & nợ",
                icon: Users,
                onClick: () => router.push("/khach-hang"),
              },
              {
                label: "Kho sản phẩm dầu nhớt",
                icon: Boxes,
                onClick: () => router.push("/san-pham"),
              },
              {
                label: "Quản trị đội xe & chu kỳ",
                icon: Truck,
                onClick: () => router.push("/fleet"),
              },
              {
                label: "Trạm tích điểm QR thợ",
                icon: QrCode,
                onClick: () => router.push("/tich-diem"),
              },
              {
                label: "Quản lý vỏ phuy 200L",
                icon: Package,
                onClick: () => router.push("/vo-phuy"),
              },
              "separator",
              {
                label: "Tổng quan Dashboard & RFM",
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
              <span className="hidden sm:inline">Chờ sync:</span>
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
                  Offline
                </span>
              </>
            ) : (
              <>
                <span className="h-2 w-2 shrink-0 animate-pulse rounded-full bg-emerald-500" />
                <Wifi className="hidden h-3.5 w-3.5 shrink-0 text-emerald-600 sm:inline" />
                <span className="font-mono text-[11px] font-bold text-emerald-800">
                  Online
                </span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              soundFX.playClick();
              setProfileOpen(true);
            }}
            className="flex cursor-pointer items-center gap-1.5 border-l border-slate-200 pl-2 sm:gap-2 sm:pl-3"
            title="Hồ sơ & đăng xuất"
          >
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-900 font-mono text-xs font-bold text-amber-400 shadow-xs sm:h-8 sm:w-8">
              {initials || "U"}
            </div>
            <div className="hidden max-w-[140px] flex-col md:max-w-[200px] sm:flex">
              <span className="text-[9px] leading-none font-medium text-slate-400">
                Tài khoản
              </span>
              <span className="truncate text-xs font-semibold text-slate-800">
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
