export type AuthDemoRole = "sales" | "accountant" | "director" | "fleet" | "dealer";

export type AuthUserProfile = {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: AuthDemoRole;
  roleTitle: string;
  department: string;
  assignedWarehouse: string;
  rawRole?: string;
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
  "admin.thang@remixoil.vn",
  "ketoan.btt@remixoil.vn",
  "sales.anv@remixoil.vn",
  "fleet.doixe@remixoil.vn",
  "dealer.garage@remixoil.vn",
] as const;

/**
 * Metadata templates for demo personas (merged when user exists in Prisma).
 * Quick-login UI must NOT render this list blindly — only users returned from DB.
 */
export const DEMO_USER_TEMPLATES: AuthUserProfile[] = [
  {
    id: "USR-03",
    name: "Trần Hữu Thắng",
    email: "admin.thang@remixoil.vn",
    phone: "0988 123 456",
    role: "director",
    roleTitle: "Giám Đốc Kinh Doanh (Quản Trị Viên Toàn Quyền)",
    department: "Ban Điều Hành & Chiến Lược Phân Phối",
    assignedWarehouse: "Toàn Bộ Hệ Thống Phân Phối",
    rawRole: "ADMIN",
    lastLogin: "Hôm nay lúc 06:30",
    permissions: {
      canApproveCredit: true,
      canViewCostPrice: true,
      canCreateOrders: true,
      canManageStaff: true,
      canExportReports: true,
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
    rawRole: "ACCOUNTANT",
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
    id: "USR-01",
    name: "Nguyễn Văn A",
    email: "sales.anv@remixoil.vn",
    phone: "0912 345 678",
    role: "sales",
    roleTitle: "Chuyên Viên Sales Thị Trường (Field Sales)",
    department: "Khối Kinh Doanh & Phân Phối Vùng Đông Nam Bộ",
    assignedWarehouse: "Kho Tổng Bình Chánh (TP.HCM)",
    rawRole: "SALES",
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
    id: "USR-04",
    name: "Lê Hoàng Đội Xe",
    email: "fleet.doixe@remixoil.vn",
    phone: "0933 555 777",
    role: "fleet",
    roleTitle: "Điều Phối Đội Xe & Vận Tải Giao Nhận",
    department: "Bộ Phận Vận Tải & Đội Xe Cơ Giới",
    assignedWarehouse: "Kho Tổng Bình Chánh (TP.HCM)",
    rawRole: "FLEET",
    lastLogin: "Hôm nay lúc 07:15",
    permissions: {
      canApproveCredit: false,
      canViewCostPrice: false,
      canCreateOrders: true,
      canManageStaff: false,
      canExportReports: false,
    },
  },
  {
    id: "USR-05",
    name: "Garage Hoàng Phát (Đại Lý)",
    email: "dealer.garage@remixoil.vn",
    phone: "0977 888 111",
    role: "dealer",
    roleTitle: "Đại Lý Cấp 1 & Trung Tâm Garage Đối Tác",
    department: "Mạng Lưới Đại Lý & Garage Ủy Quyền",
    assignedWarehouse: "Điểm Đại Lý Khu Vực Q7",
    rawRole: "DEALER",
    lastLogin: "Hôm nay lúc 08:00",
    permissions: {
      canApproveCredit: false,
      canViewCostPrice: false,
      canCreateOrders: true,
      canManageStaff: false,
      canExportReports: false,
    },
  },
];

/** @deprecated Use DEMO_USER_TEMPLATES + listQuickLoginUsers() */
export const DEMO_USERS = DEMO_USER_TEMPLATES;

export const DEMO_PASSWORD = "123456";

export function mapPrismaRoleToAuthDemo(role: string): AuthDemoRole {
  if (role === "ADMIN") return "director";
  if (role === "ACCOUNTANT") return "accountant";
  if (role === "FLEET") return "fleet";
  if (role === "DEALER") return "dealer";
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
    return { ...demo, id: input.id, name: input.name || demo.name, rawRole: input.role };
  }
  const authRole = mapPrismaRoleToAuthDemo(input.role);
  const roleTitleMap: Record<AuthDemoRole, string> = {
    director: "Quản Trị Viên (ADMIN)",
    accountant: "Kế Toán & Công Nợ",
    sales: "Sales Thị Trường",
    fleet: "Điều Phối Đội Xe & Vận Tải",
    dealer: "Đại Lý Cấp 1 / Đối Tác Garage",
  };
  return {
    id: input.id,
    name: input.name || input.email.split("@")[0] || "User",
    email: input.email,
    phone: "—",
    role: authRole,
    roleTitle: roleTitleMap[authRole] || "Người dùng",
    department: authRole === "fleet" ? "Bộ Phận Vận Tải" : authRole === "dealer" ? "Khách Hàng Đại Lý" : "Hệ thống CRM Dầu Nhớt",
    assignedWarehouse: "Kho Tổng Bình Chánh",
    rawRole: input.role,
    lastLogin: "Phiên hiện tại",
    permissions: {
      canApproveCredit: authRole === "director" || authRole === "accountant",
      canViewCostPrice: authRole === "director" || authRole === "accountant",
      canCreateOrders: true,
      canManageStaff: authRole === "director",
      canExportReports: authRole === "director" || authRole === "accountant",
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

