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
  Receipt,
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  allowedRoles?: UserRole[];
  requiresAdmin?: boolean;
};

export type NavGroup = {
  id: string;
  label: string;
  allowedRoles?: UserRole[];
  items: NavItem[];
};

export const navGroups: NavGroup[] = [
  {
    id: "tong-quan",
    label: "Tổng quan",
    allowedRoles: ["ADMIN", "ACCOUNTANT", "SALES"],
    items: [
      {
        href: "/dashboard",
        label: "Dashboard & RFM",
        icon: LayoutDashboard,
        allowedRoles: ["ADMIN", "ACCOUNTANT", "SALES"],
      },
    ],
  },
  {
    id: "kinh-doanh",
    label: "Kinh doanh & Thực địa",
    items: [
      {
        href: "/khach-hang",
        label: "Khách hàng & Công nợ",
        icon: Users,
        allowedRoles: ["ADMIN", "ACCOUNTANT", "SALES"],
      },
      {
        href: "/phieu-thu",
        label: "Sổ phiếu thu nợ",
        icon: Receipt,
        allowedRoles: ["ADMIN", "ACCOUNTANT"],
      },
      {
        href: "/don-hang",
        label: "Đơn hàng & Kanban",
        icon: ClipboardList,
        allowedRoles: ["ADMIN", "ACCOUNTANT", "SALES", "FLEET", "DEALER"],
      },
      {
        href: "/fleet",
        label: "Đội xe & Bảo dưỡng",
        icon: Truck,
        allowedRoles: ["ADMIN", "FLEET"],
      },
      {
        href: "/sales",
        label: "Tuyến Sales & Check-in",
        icon: Route,
        allowedRoles: ["ADMIN", "SALES"],
      },
      {
        href: "/tich-diem",
        label: "Tích điểm thợ máy",
        icon: Gift,
        allowedRoles: ["ADMIN", "SALES", "DEALER"],
      },
    ],
  },
  {
    id: "kho",
    label: "Kho & Hàng hóa",
    items: [
      {
        href: "/san-pham",
        label: "Master Data sản phẩm",
        icon: Package,
        allowedRoles: ["ADMIN", "ACCOUNTANT", "SALES", "FLEET", "DEALER"],
      },
      {
        href: "/vo-phuy",
        label: "Quản lý vỏ phuy",
        icon: Cylinder,
        allowedRoles: ["ADMIN", "ACCOUNTANT", "SALES", "FLEET", "DEALER"],
      },
    ],
  },
  {
    id: "he-thong",
    label: "Hệ thống",
    allowedRoles: ["ADMIN"],
    items: [
      {
        href: "/nhan-su",
        label: "Nhân sự & Phân quyền",
        icon: Shield,
        allowedRoles: ["ADMIN"],
      },
      {
        href: "/cau-hinh",
        label: "Cấu hình hệ thống",
        icon: Settings,
        allowedRoles: ["ADMIN"],
      },
    ],
  },
];

function canAccess(
  allowedRoles: UserRole[] | undefined,
  requiresAdmin: boolean | undefined,
  role: string,
): boolean {
  if (role === "ADMIN") return true;
  if (requiresAdmin) return false;
  if (!allowedRoles) return true;
  return allowedRoles.includes(role as UserRole);
}

export function filterNavGroups(
  role: UserRole | string,
  groups: NavGroup[] = navGroups,
): NavGroup[] {
  const normalizedRole = String(role).toUpperCase();
  return groups
    .filter((group) => canAccess(group.allowedRoles, undefined, normalizedRole))
    .map((group) => ({
      ...group,
      items: group.items.filter((item) =>
        canAccess(item.allowedRoles, item.requiresAdmin, normalizedRole),
      ),
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
