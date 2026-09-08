'use client';

import { Wifi, CloudOff, RefreshCw, Menu, LogOut, User as UserIcon } from 'lucide-react';
import { AuthUser } from '../types';

interface HeaderProps {
  currentModuleName: string;
  currentUser: string;
  authUser?: AuthUser;
  onUserChange?: (user: string) => void;
  onOpenProfile?: () => void;
  onRequestLogout?: () => void;
  isOffline: boolean;
  onToggleOffline: () => void;
  offlineCount?: number;
  onSyncOffline?: () => void;
  onNavigateToSales?: () => void;
  onOpenMobileMenu?: () => void;
}

export default function Header({
  currentModuleName,
  currentUser,
  authUser,
  onUserChange,
  onOpenProfile,
  onRequestLogout,
  isOffline,
  onToggleOffline,
  offlineCount = 0,
  onSyncOffline,
  onOpenMobileMenu,
}: HeaderProps) {
  const displayName = authUser ? authUser.name : currentUser;
  const roleLabel = authUser
    ? authUser.role === 'director'
      ? 'GĐ Kinh Doanh'
      : authUser.role === 'accountant'
      ? 'Kế Toán Trưởng'
      : 'Sales Thực Địa'
    : currentUser.includes('Admin')
    ? 'GĐ Kinh Doanh'
    : currentUser.includes('Kế Toán')
    ? 'Kế Toán'
    : 'Sales';

  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .slice(-2)
    .join('')
    .toUpperCase();

  return (
    <header
      id="app-header"
      className="bg-white border-b border-slate-200 px-3 sm:px-6 py-2.5 flex items-center justify-between sticky top-0 z-30 shadow-xs"
    >
      {/* Left: Mobile Hamburger button & Breadcrumbs */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        {/* Mobile Hamburger Button (Only on < 1024px) */}
        {onOpenMobileMenu && (
          <button
            id="mobile-hamburger-btn"
            onClick={onOpenMobileMenu}
            className="lg:hidden p-2 -ml-1 rounded-xl text-slate-700 hover:text-slate-950 hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
            title="Mở menu tính năng"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        {/* Current Screen Title & Breadcrumbs */}
        <div className="flex items-center gap-2 min-w-0">
          <div className="hidden md:flex items-center gap-1.5 text-xs text-slate-400 font-medium font-mono shrink-0">
            <span className="text-amber-600 font-bold">DMS</span>
            <span>/</span>
            <span className="text-slate-600">Remix Lubricants</span>
            <span className="text-slate-300">|</span>
          </div>
          <h1 className="text-sm sm:text-base md:text-lg font-bold tracking-tight text-slate-900 truncate">
            {currentModuleName}
          </h1>
        </div>
      </div>

      {/* Right Toolbar Controls */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Offline Sync notification if orders pending in queue */}
        {offlineCount > 0 && (
          <button
            onClick={onSyncOffline}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-amber-50 text-amber-900 border border-amber-300 text-xs font-semibold hover:bg-amber-100 transition-colors animate-pulse cursor-pointer"
            title="Nhấn để đồng bộ đơn hàng ngoại tuyến lên máy chủ"
          >
            <RefreshCw className="w-3.5 h-3.5 text-amber-600 animate-spin" />
            <span className="hidden sm:inline">Chờ sync:</span>
            <strong>{offlineCount}</strong>
          </button>
        )}

        {/* Network Status Toggle Button */}
        <button
          id="network-status-toggle"
          onClick={onToggleOffline}
          title="Nhấp để chuyển đổi giả lập Online/Offline để kiểm tra cơ chế Offline-First"
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
            isOffline
              ? 'bg-amber-50 text-amber-900 border-amber-300 shadow-xs'
              : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
          }`}
        >
          {isOffline ? (
            <>
              <CloudOff className="w-3.5 h-3.5 text-amber-700 shrink-0" />
              <span className="text-[11px] font-bold text-amber-800 font-mono">Offline</span>
            </>
          ) : (
            <>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <Wifi className="w-3.5 h-3.5 text-emerald-600 shrink-0 hidden sm:inline" />
              <span className="text-[11px] font-bold text-emerald-800 font-mono">Online</span>
            </>
          )}
        </button>

        {/* User Account Profile Pill */}
        <div className="flex items-center gap-1.5 sm:gap-2 border-l border-slate-200 pl-2 sm:pl-3">
          <button
            id="user-profile-header-btn"
            onClick={onOpenProfile}
            title="Xem hồ sơ nhân sự, phân quyền RBAC & đổi mật khẩu"
            className="flex items-center gap-2 p-1 sm:px-2.5 sm:py-1 rounded-xl hover:bg-slate-100 transition-all cursor-pointer group text-left"
          >
            <div className="w-8 h-8 rounded-xl bg-slate-900 text-amber-400 font-bold text-xs flex items-center justify-center font-mono shadow-xs shrink-0 group-hover:scale-105 transition-transform">
              {initials || <UserIcon className="w-4 h-4" />}
            </div>
            <div className="hidden sm:flex flex-col max-w-[130px] md:max-w-[170px]">
              <span className="text-xs font-extrabold text-slate-900 truncate leading-tight">
                {displayName}
              </span>
              <span className="text-[10px] text-amber-700 font-semibold font-mono truncate leading-none mt-0.5">
                {roleLabel}
              </span>
            </div>
          </button>

          {/* Dedicated Logout Action Button in Header */}
          {onRequestLogout && (
            <button
              id="header-quick-logout-btn"
              onClick={onRequestLogout}
              title="Đăng xuất khỏi hệ thống DMS"
              className="p-2 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer shrink-0"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
