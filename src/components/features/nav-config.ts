import type { LucideIcon } from "lucide-react";
import type { UserRole } from "@prisma/client";
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  Truck,
  Route,
  Package,
  Shield,
  Settings,
  Gift,
  Cylinder,
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  requiresAdmin?: boolean;
};

export type NavGroup = {
  id: string;
  label: string;
  requiresAdmin?: boolean;
  items: NavItem[];
};

export const navGroups: NavGroup[] = [
  {
    id: "tong-quan",
    label: "Tổng quan",
    items: [
      { href: "/dashboard", label: "Dashboard & RFM", icon: LayoutDashboard },
    ],
  },
  {
    id: "kinh-doanh",
    label: "Kinh doanh & Thực địa",
    items: [
      { href: "/khach-hang", label: "Khách hàng & Công nợ", icon: Users },
      { href: "/don-hang", label: "Đơn hàng & Kanban", icon: ClipboardList },
      { href: "/fleet", label: "Đội xe & Bảo dưỡng", icon: Truck },
      { href: "/sales", label: "Tuyến Sales & Check-in", icon: Route },
      { href: "/tich-diem", label: "Tích điểm thợ máy", icon: Gift },
    ],
  },
  {
    id: "kho",
    label: "Kho & Hàng hóa",
    items: [
      { href: "/san-pham", label: "Master Data sản phẩm", icon: Package },
      { href: "/vo-phuy", label: "Quản lý vỏ phuy", icon: Cylinder },
    ],
  },
  {
    id: "he-thong",
    label: "Hệ thống",
    requiresAdmin: true,
    items: [
      {
        href: "/nhan-su",
        label: "Nhân sự & Phân quyền",
        icon: Shield,
        requiresAdmin: true,
      },
      {
        href: "/cau-hinh",
        label: "Cấu hình hệ thống",
        icon: Settings,
        requiresAdmin: true,
      },
    ],
  },
];

function canAccess(
  requiresAdmin: boolean | undefined,
  role: string,
): boolean {
  if (!requiresAdmin) return true;
  return role === "ADMIN";
}

export function filterNavGroups(
  role: UserRole | string,
  groups: NavGroup[] = navGroups,
): NavGroup[] {
  return groups
    .filter((group) => canAccess(group.requiresAdmin, role))
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => canAccess(item.requiresAdmin, role)),
    }))
    .filter((group) => group.items.length > 0);
}

export function isNavActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function getNavTitle(
  pathname: string,
  role: UserRole | string = "SALES",
): string {
  for (const group of filterNavGroups(role)) {
    const match = group.items.find((item) => isNavActive(pathname, item.href));
    if (match) return match.label;
  }
  return "CRM";
}

export function flattenNavItems(role: UserRole | string = "SALES"): NavItem[] {
  return filterNavGroups(role).flatMap((group) => group.items);
}
