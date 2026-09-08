export type AuthDemoRole = "sales" | "accountant" | "director";

export type AuthUserProfile = {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: AuthDemoRole;
  roleTitle: string;
  department: string;
  assignedWarehouse: string;
  lastLogin?: string;
  permissions: {
    canApproveCredit: boolean;
    canViewCostPrice: boolean;
    canCreateOrders: boolean;
    canManageStaff: boolean;
    canExportReports: boolean;
  };
};

/** Canonical demo emails used for seed + quick-login filter. */
export const QUICK_LOGIN_DEMO_EMAILS = [
  "sales.anv@remixoil.vn",
  "ketoan.btt@remixoil.vn",
  "admin.thang@remixoil.vn",
] as const;

/**
 * Metadata templates for demo personas (merged when user exists in Prisma).
 * Quick-login UI must NOT render this list blindly — only users returned from DB.
 */
export const DEMO_USER_TEMPLATES: AuthUserProfile[] = [
  {
    id: "USR-01",
    name: "Nguyễn Văn A",
    email: "sales.anv@remixoil.vn",
    phone: "0912 345 678",
    role: "sales",
    roleTitle: "Chuyên Viên Sales Thị Trường (Field Sales)",
    department: "Khối Kinh Doanh & Phân Phối Vùng Đông Nam Bộ",
    assignedWarehouse: "Kho Tổng Bình Chánh (TP.HCM)",
    lastLogin: "Hôm nay lúc 08:15",
    permissions: {
      canApproveCredit: false,
      canViewCostPrice: false,
      canCreateOrders: true,
      canManageStaff: false,
      canExportReports: false,
    },
  },
  {
    id: "USR-02",
    name: "Trần Thị B",
    email: "ketoan.btt@remixoil.vn",
    phone: "0903 888 999",
    role: "accountant",
    roleTitle: "Kế Toán Trưởng & Quản Lý Công Nợ B2B",
    department: "Phòng Tài Chính - Kế Toán Doanh Nghiệp",
    assignedWarehouse: "Kho Tổng Bình Chánh (TP.HCM)",
    lastLogin: "Hôm nay lúc 07:45",
    permissions: {
      canApproveCredit: true,
      canViewCostPrice: true,
      canCreateOrders: true,
      canManageStaff: false,
      canExportReports: true,
    },
  },
  {
    id: "USR-03",
    name: "Trần Hữu Thắng",
    email: "admin.thang@remixoil.vn",
    phone: "0988 123 456",
    role: "director",
    roleTitle: "Giám Đốc Kinh Doanh (Quản Trị Viên Toàn Quyền)",
    department: "Ban Điều Hành & Chiến Lược Phân Phối",
    assignedWarehouse: "Toàn Bộ Hệ Thống Phân Phối",
    lastLogin: "Hôm nay lúc 06:30",
    permissions: {
      canApproveCredit: true,
      canViewCostPrice: true,
      canCreateOrders: true,
      canManageStaff: true,
      canExportReports: true,
    },
  },
];

/** @deprecated Use DEMO_USER_TEMPLATES + listQuickLoginUsers() */
export const DEMO_USERS = DEMO_USER_TEMPLATES;

export const DEMO_PASSWORD = "123456";

export function mapPrismaRoleToAuthDemo(role: string): AuthDemoRole {
  if (role === "ADMIN") return "director";
  if (role === "ACCOUNTANT") return "accountant";
  return "sales";
}

export function isDemoQuickLoginEmail(email: string): boolean {
  const normalized = email.trim().toLowerCase();
  return QUICK_LOGIN_DEMO_EMAILS.some((e) => e === normalized);
}

export function sessionToAuthUserProfile(input: {
  id: string;
  email: string;
  name: string | null;
  role: string;
}): AuthUserProfile {
  const demo = DEMO_USER_TEMPLATES.find(
    (u) => u.email.toLowerCase() === input.email.toLowerCase(),
  );
  if (demo) {
    return { ...demo, id: input.id, name: input.name || demo.name };
  }
  const authRole = mapPrismaRoleToAuthDemo(input.role);
  return {
    id: input.id,
    name: input.name || input.email.split("@")[0] || "User",
    email: input.email,
    phone: "—",
    role: authRole,
    roleTitle:
      authRole === "director"
        ? "Quản Trị Viên"
        : authRole === "accountant"
          ? "Kế Toán"
          : "Sales Thị Trường",
    department: "Hệ thống CRM Dầu Nhớt",
    assignedWarehouse: "Kho Tổng",
    lastLogin: "Phiên hiện tại",
    permissions: {
      canApproveCredit: authRole !== "sales",
      canViewCostPrice: authRole !== "sales",
      canCreateOrders: true,
      canManageStaff: authRole === "director",
      canExportReports: authRole !== "sales",
    },
  };
}

export type QuickLoginUserDto = {
  id: string;
  name: string;
  email: string;
  role: AuthDemoRole;
  roleLabel: string;
};
