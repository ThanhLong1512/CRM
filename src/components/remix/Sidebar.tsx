"use client";
import { ElementType } from 'react';
import AppLogo from '@/components/common/AppLogo';
import { useTranslation } from '@/components/providers/language-provider';
import { NavigationModule } from '../types';
import {
  LayoutDashboard,
  Users,
  ShoppingCart,
  Truck,
  MapPin,
  QrCode,
  Package,
  Boxes,
  ShieldCheck,
  Flame,
  Settings,
  X,
  Receipt,
} from 'lucide-react';

import type { SystemSettingDto } from '@/lib/data/settings';
import type { AuthUserProfile } from '@/components/auth/authData';
import type { UserRole } from '@prisma/client';

export const MODULE_ALLOWED_ROLES: Record<NavigationModule, UserRole[]> = {
  dashboard: ["ADMIN", "ACCOUNTANT", "SALES"],
  customers: ["ADMIN", "ACCOUNTANT", "SALES"],
  kanban: ["ADMIN", "ACCOUNTANT", "SALES", "FLEET", "DEALER"],
  debt_receipts: ["ADMIN", "ACCOUNTANT"],
  fleet: ["ADMIN", "FLEET"],
  sales_pwa: ["ADMIN", "SALES"],
  loyalty_qr: ["ADMIN", "SALES", "DEALER"],
  products: ["ADMIN", "ACCOUNTANT", "SALES", "FLEET", "DEALER"],
  drums: ["ADMIN", "ACCOUNTANT", "SALES", "FLEET", "DEALER"],
  staff_rbac: ["ADMIN"],
  settings: ["ADMIN"],
};

interface SidebarProps {
  currentModule: NavigationModule;
  onSelectModule: (module: NavigationModule) => void;
  pendingOrdersCount: number;
  urgentFleetCount: number;
  rfmAlertCount: number;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
  systemSettings?: SystemSettingDto;
  sessionUser?: AuthUserProfile | null;
  userRole?: UserRole | string;
}

interface NavItem {
  id: NavigationModule;
  label: string;
  icon: ElementType;
  badge?: number;
  badgeVariant?: 'critical' | 'warning' | 'info';
}

interface NavGroup {
  groupLabel: string;
  items: NavItem[];
}

export default function Sidebar({
  currentModule,
  onSelectModule,
  pendingOrdersCount,
  urgentFleetCount,
  rfmAlertCount,
  isOpenMobile = false,
  onCloseMobile,
  systemSettings,
  sessionUser,
  userRole,
}: SidebarProps) {
  const { t } = useTranslation();

  const resolvedRole: UserRole = (() => {
    const raw = sessionUser?.rawRole || userRole;
    if (raw && ["ADMIN", "ACCOUNTANT", "SALES", "FLEET", "DEALER"].includes(raw as UserRole)) {
      return raw as UserRole;
    }
    if (sessionUser?.role === "director") return "ADMIN";
    if (sessionUser?.role === "accountant") return "ACCOUNTANT";
    if (sessionUser?.role === "fleet") return "FLEET";
    if (sessionUser?.role === "dealer") return "DEALER";
    return "SALES";
  })();

  const getCustomLabel = (id: NavigationModule, defaultLabel: string): string => {
    if (resolvedRole === "FLEET") {
      if (id === "kanban") return "Đơn hàng & Giao vận";
      if (id === "drums") return "Ký nhận & Vỏ phuy";
      if (id === "products") return "Tra cứu dầu nhớt xe";
    }
    if (resolvedRole === "DEALER") {
      if (id === "kanban") return "Đơn đặt hàng đại lý";
      if (id === "products") return "Bảng giá & Danh mục";
      if (id === "drums") return "Vỏ phuy đang mượn";
      if (id === "loyalty_qr") return "Tích điểm & Đổi quà";
    }
    return defaultLabel;
  };

  const navigationGroups: NavGroup[] = [
    {
      groupLabel: t('navOverview'),
      items: [
        {
          id: 'dashboard',
          label: t('modDashboard'),
          icon: LayoutDashboard,
          badge: rfmAlertCount > 0 ? rfmAlertCount : undefined,
          badgeVariant: 'warning',
        },
      ],
    },
    {
      groupLabel: resolvedRole === "DEALER" ? "Đại lý phân phối" : resolvedRole === "FLEET" ? "Vận tải & Giao vận" : t('navSalesField'),
      items: [
        {
          id: 'customers',
          label: t('modCustomers'),
          icon: Users,
        },
        {
          id: 'kanban',
          label: getCustomLabel('kanban', t('modOrders')),
          icon: ShoppingCart,
          badge: pendingOrdersCount > 0 ? pendingOrdersCount : undefined,
          badgeVariant: 'info',
        },
        {
          id: 'debt_receipts',
          label: 'Sổ phiếu thu nợ',
          icon: Receipt,
        },
        {
          id: 'fleet',
          label: t('modFleet'),
          icon: Truck,
          badge: urgentFleetCount > 0 ? urgentFleetCount : undefined,
          badgeVariant: 'critical',
        },
        {
          id: 'sales_pwa',
          label: t('modSalesPwa'),
          icon: MapPin,
        },
        {
          id: 'loyalty_qr',
          label: getCustomLabel('loyalty_qr', t('modLoyaltyQr')),
          icon: QrCode,
        },
      ],
    },
    {
      groupLabel: resolvedRole === "DEALER" ? "Hàng hóa & Vỏ phuy" : resolvedRole === "FLEET" ? "Kho phuy & Hàng hóa" : t('navInventoryWarehouse'),
      items: [
        {
          id: 'products',
          label: getCustomLabel('products', t('modProducts')),
          icon: Boxes,
        },
        {
          id: 'drums',
          label: getCustomLabel('drums', t('modDrums')),
          icon: Package,
        },
      ],
    },
    {
      groupLabel: t('navSystem'),
      items: [
        {
          id: 'staff_rbac',
          label: t('modStaffRbac'),
          icon: ShieldCheck,
        },
        {
          id: 'settings',
          label: t('modSettings'),
          icon: Settings,
        },
      ],
    },
  ];

  const filteredNavigationGroups = navigationGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => {
        const allowed = MODULE_ALLOWED_ROLES[item.id] || ["ADMIN"];
        return allowed.includes(resolvedRole);
      }),
    }))
    .filter((group) => group.items.length > 0);

  const handleItemClick = (mod: NavigationModule) => {
    onSelectModule(mod);
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  const renderNavContent = (isMobile = false) => (
    <div className="flex flex-col flex-1 h-full justify-between">
      <div className="flex flex-col flex-1 overflow-y-auto">
        {/* Brand Header */}
        <div className="p-4 border-b border-slate-800/80 bg-[#0F172A] flex items-center justify-between">
          <AppLogo variant="sidebar" />

          {/* Close button on mobile drawer */}
          {isMobile && onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              title={t("closeMenu")}
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        <div className="px-4 py-2 border-b border-slate-800/50 bg-[#0F172A]/50 text-[11px] text-slate-400 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
          <span>{t("branchName")} &bull; {t("version")}</span>
        </div>

        {/* Navigation Groups */}
        <nav className="p-3 space-y-4 flex-1">
          {filteredNavigationGroups.map((group) => (
            <div key={group.groupLabel} className="space-y-1">
              <div className="px-3 text-[10px] font-bold tracking-wider text-slate-500 uppercase">
                {group.groupLabel}
              </div>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const isActive = currentModule === item.id;
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      id={`sidebar-nav-${item.id}${isMobile ? '-mobile' : ''}`}
                      onClick={() => handleItemClick(item.id)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-all flex items-center justify-between group cursor-pointer ${
                        isActive
                          ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                          : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Icon
                          className={`w-4 h-4 shrink-0 transition-colors ${
                            isActive
                              ? 'text-slate-950'
                              : 'text-slate-400 group-hover:text-amber-400'
                          }`}
                        />
                        <span className="truncate">{item.label}</span>
                      </div>

                      {/* Badges */}
                      {item.badge !== undefined && (
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono font-bold leading-none shrink-0 ${
                            isActive
                              ? 'bg-slate-950 text-amber-400'
                              : item.badgeVariant === 'critical'
                              ? 'bg-rose-500 text-white'
                              : item.badgeVariant === 'warning'
                              ? 'bg-amber-500 text-slate-950'
                              : 'bg-cyan-500 text-white'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </div>



      {/* Warehouse & Quick Info Footer */}
      <div className="p-3 m-3 rounded-xl bg-slate-800/60 border border-slate-700/80 text-xs text-slate-300 shrink-0">
        <div className="flex items-center justify-between text-white font-semibold mb-1">
          <span className="text-[11px] truncate max-w-[140px]" title={systemSettings?.companyName || t("centralWarehouse")}>
            {systemSettings?.companyName || t("centralWarehouse")}
          </span>
          <span className="text-[10px] px-1.5 py-0.2 bg-emerald-500/20 text-emerald-300 rounded font-mono shrink-0">
            {t("warehouseStatusReady")}
          </span>
        </div>
        <div className="text-[11px] text-slate-400 line-clamp-2 leading-tight mt-0.5" title={systemSettings?.centralWarehouseAddress || t("warehouseAddress")}>
          {systemSettings?.centralWarehouseAddress || t("warehouseAddress")}
        </div>
        <div className="mt-2 pt-2 border-t border-slate-700/60 flex items-center justify-between text-[10px] text-slate-400 font-mono">
          <span>{t("technicalHotline")}</span>
          <span className="text-amber-400 font-bold font-mono tracking-wider">
            {systemSettings?.hotline || "1900 6868"}
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* 1. Desktop Static Sidebar: Visible on lg (>= 1024px) */}
      <aside
        id="app-sidebar-desktop"
        className="hidden lg:flex w-64 shrink-0 bg-[#0F172A] border-r border-slate-800 flex-col justify-between min-h-screen text-slate-100 select-none z-20 sticky top-0 h-screen"
      >
        {renderNavContent(false)}
      </aside>

      {/* 2. Mobile/Tablet Drawer (Sliding Sheet): When isOpenMobile is true (< 1024px) */}
      {isOpenMobile && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Dark Backdrop */}
          <div
            id="mobile-sidebar-backdrop"
            onClick={onCloseMobile}
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
          />

          {/* Sliding Menu Drawer */}
          <aside
            id="app-sidebar-mobile-drawer"
            className="relative w-72 max-w-[85vw] bg-[#0F172A] z-50 shadow-2xl flex flex-col justify-between text-slate-100 h-full animate-in slide-in-from-left duration-300 ease-out"
          >
            {renderNavContent(true)}
          </aside>
        </div>
      )}
    </>
  );
}
