export type CustomerType = 'Đại lý' | 'Đội xe' | 'Thợ';

export type BaseOilType = 'Khoáng' | 'Bán tổng hợp' | 'Tổng hợp toàn phần';
export type PackageType = 'Phuy 200L' | 'Thùng 18L' | 'Xô 4L' | 'Chai 1L';

export interface Product {
  id: string;
  name: string;
  sku: string;
  unit: string;
  packageType: PackageType;
  viscosity: string; // e.g. "10W-40", "15W-40", "80W-90", "ISO VG 46"
  standards: string; // e.g. "API CK-4 / ACEA E9", "API SN / JASO MA2"
  baseOil: BaseOilType;
  drumReturnable?: boolean;
  priceDealer: number;
  priceMechanic: number;
  priceFleet: number;
  stock: number;
  minSafeStock: number;
  maxStock: number;
  vatPercent: number;
  brand: string;
  category: string;
  image?: string;
  isForSale?: boolean;
}

export interface Customer {
  id: string;
  name: string;
  code?: string;
  type: CustomerType;
  phone?: string;
  address: string;
  lat: number;
  lng: number;
  hasGps: boolean;
  route: string;
  creditLimit: number;
  currentDebt: number;
  emptyDrums: number;
  drumBalance?: number;
  loyaltyPoints?: number;
  lastPurchaseDaysAgo: number;
  avgCycleDays?: number; // e.g. 18 days cycle
  favoriteSku?: string;
  rfmSegment?: 'VIP' | 'At Risk' | 'Potential' | 'Stable';
}

export type Vehicle = FleetVehicle;

export interface FleetVehicle {
  id: string;
  customerId: string;
  customerName?: string;
  vehicleType: string;
  plate: string;
  currentKm: number;
  nextOilChangeKm: number;
  recommendedOil: string; // e.g. "Dầu động cơ Turbo Diesel 15W-40 (Cần 18 Lít)"
  oilCapacityLiters?: number;
  status: 'Xanh' | 'Vàng' | 'Đỏ';
  oilLifePercent?: number; // 0 - 100%
}

export type OrderStatus = 'Chờ duyệt' | 'Xuất kho' | 'Giao hàng' | 'Hoàn thành';

export interface OrderItem {
  productId: string;
  productName: string;
  sku?: string;
  packageType?: PackageType;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Order {
  id: string;
  customer: string;
  customerId?: string;
  customerType?: CustomerType;
  total: number;
  status: OrderStatus;
  items?: OrderItem[];
  createdAt?: string;
  isOverCredit?: boolean;
  creditApprovedBy?: string;
  driverName?: string;
  driverPhone?: string;
  pickingDetails?: {
    drums200L: number;
    pails18L: number;
    bottles: number;
  };
  drumExchange?: {
    delivered: number;
    returned: number;
  };
  gpsVerification?: {
    lat: number;
    lng: number;
    offsetMeters: number;
    timestamp: string;
    verified: boolean;
  };
  signature?: string;
  digitalSignature?: string;
}

export interface DrumTransaction {
  id: string;
  customerId: string;
  customerName: string;
  delivered: number;
  returned: number;
  balanceAfter: number;
  depositValue?: number; // 400.000đ per drum
  timestamp: string;
  signature?: string;
  signedBy?: string;
}

export interface SalesStaff {
  id: string;
  name: string;
  code: string;
  role: string;
  avatar?: string;
  phone: string;
  assignedRoute: string;
  todayVisits: {
    completed: number;
    total: number;
  };
  mtdRevenue: number;
  mtdTarget: number;
  debtCollected: number;
  lastCheckIn?: {
    customerName: string;
    time: string;
    coords: string;
  };
  permissions: {
    approveOverCredit: boolean;
    createSpecialPromo: boolean;
    editGpsCoords: boolean;
    drumOffset: boolean;
    viewCostPrice: boolean;
  };
}

export type UserRole = 'sales' | 'accountant' | 'director' | 'dealer';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  roleTitle: string;
  avatar?: string;
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
}

export type NavigationModule =
  | 'dashboard'
  | 'products'
  | 'customers'
  | 'sales_pwa'
  | 'fleet'
  | 'loyalty_qr'
  | 'drums'
  | 'kanban'
  | 'staff_rbac'
  | 'settings';
