import type { LucideIcon } from "lucide-react";
import type { UserRole } from "@prisma/client";
import {
  Home,
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
    items: [{ href: "/dashboard", label: "Dashboard", icon: Home }],
  },
  {
    id: "kinh-doanh",
    label: "Kinh doanh",
    items: [
      { href: "/khach-hang", label: "Khách hàng", icon: Users },
      { href: "/don-hang", label: "Đơn hàng", icon: ClipboardList },
      { href: "/fleet", label: "Đội xe", icon: Truck },
      { href: "/sales", label: "Tuyến Sales", icon: Route },
      { href: "/tich-diem", label: "Tích điểm", icon: Gift },
    ],
  },
  {
    id: "kho",
    label: "Kho & Hàng hóa",
    items: [
      { href: "/san-pham", label: "Sản phẩm", icon: Package },
      { href: "/vo-phuy", label: "Vỏ phuy", icon: Cylinder },
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
        label: "Cấu hình",
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
