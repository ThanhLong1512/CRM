import { AuthUser } from '../../types';

export const DEMO_USERS: AuthUser[] = [
  {
    id: 'USR-01',
    name: 'Nguyễn Văn A',
    email: 'sales.anv@remixoil.vn',
    phone: '0912 345 678',
    role: 'sales',
    roleTitle: 'Chuyên Viên Sales Thị Trường (Field Sales)',
    department: 'Khối Kinh Doanh & Phân Phối Vùng Đông Nam Bộ',
    assignedWarehouse: 'Kho Tổng Bình Chánh (TP.HCM)',
    lastLogin: 'Hôm nay lúc 08:15',
    permissions: {
      canApproveCredit: false,
      canViewCostPrice: false,
      canCreateOrders: true,
      canManageStaff: false,
      canExportReports: false,
    },
  },
  {
    id: 'USR-02',
    name: 'Trần Thị B',
    email: 'ketoan.btt@remixoil.vn',
    phone: '0903 888 999',
    role: 'accountant',
    roleTitle: 'Kế Toán Trưởng & Quản Lý Công Nợ B2B',
    department: 'Phòng Tài Chính - Kế Toán Doanh Nghiệp',
    assignedWarehouse: 'Kho Tổng Bình Chánh (TP.HCM)',
    lastLogin: 'Hôm nay lúc 07:45',
    permissions: {
      canApproveCredit: true,
      canViewCostPrice: true,
      canCreateOrders: true,
      canManageStaff: false,
      canExportReports: true,
    },
  },
  {
    id: 'USR-03',
    name: 'Trần Hữu Thắng',
    email: 'admin.thang@remixoil.vn',
    phone: '0988 123 456',
    role: 'director',
    roleTitle: 'Giám Đốc Kinh Doanh (Quản Trị Viên Toàn Quyền)',
    department: 'Ban Điều Hành & Chiến Lược Phân Phối',
    assignedWarehouse: 'Toàn Bộ Hệ Thống Phân Phối',
    lastLogin: 'Hôm nay lúc 06:30',
    permissions: {
      canApproveCredit: true,
      canViewCostPrice: true,
      canCreateOrders: true,
      canManageStaff: true,
      canExportReports: true,
    },
  },
];

const AUTH_STORAGE_KEY = 'remix_crm_auth_user_session';

export function getSavedAuthUser(): AuthUser | null {
  try {
    if (typeof window === 'undefined') {
      return DEMO_USERS[0];
    }
    const saved = localStorage.getItem(AUTH_STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error('Error reading auth session:', e);
  }
  // Default to Demo User 1 for convenience if none saved yet
  return DEMO_USERS[0];
}

export function saveAuthUser(user: AuthUser | null): void {
  try {
    if (typeof window === 'undefined') return;
    if (user) {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  } catch (e) {
    console.error('Error saving auth session:', e);
  }
}
