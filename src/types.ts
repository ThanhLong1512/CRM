export type CustomerType = 'Đại lý' | 'Đội xe' | 'Thợ';

export type BaseOilType = 'Khoáng' | 'Bán tổng hợp' | 'Tổng hợp toàn phần';
export type PackageType =
  | 'Phuy 208L'
  | 'Phuy 200L'
  | 'Thùng 18L'
  | 'Xô 18L'
  | 'Xô 4L'
  | 'Can 4L'
  | 'Chai 1L';

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
  wholesalePrice?: number;
  garagePrice?: number;
  retailPrice?: number;
  volumeLiters?: number;
  stock: number;
  minSafeStock: number;
  maxStock: number;
  vatPercent: number;
  brand: string;
  category: string;
  image?: string;
  isForSale?: boolean;
}

export type PaymentMethod = 'CASH' | 'BANK_TRANSFER';

export interface DebtPayment {
  id: string;
  receiptNumber: string;
  customerId: string;
  customerName?: string;
  amount: number;
  method: PaymentMethod;
  notes?: string | null;
  userId: string;
  userName?: string;
  createdAt: string;
}

export type DebtAgingStatus = 'safe' | 'warning' | 'critical';

export interface DebtAging {
  current: number;
  overdue1_15: number;
  overdue16_30: number;
  badDebt: number;
  maxOverdueDays: number;
  status: DebtAgingStatus;
}

export type VisitDayOfWeek = 'T2' | 'T3' | 'T4' | 'T5' | 'T6' | 'T7';

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
  visitDay?: VisitDayOfWeek;
  visitDays?: VisitDayOfWeek[];
  visitFrequency?: 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY';
  creditLimit: number;
  creditTermDays?: number; // default 30 days
  currentDebt: number;
  debtAging?: DebtAging;
  emptyDrums: number;
  drumBalance?: number;
  loyaltyPoints?: number;
  lastPurchaseDaysAgo: number;
  avgCycleDays?: number; // e.g. 18 days cycle
  favoriteSku?: string;
  rfmSegment?: 'VIP' | 'At Risk' | 'Potential' | 'Stable';
  dealerTier?: 'GOLD' | 'SILVER' | 'RETAIL';
  creditOverridden?: boolean;
  creditOverrideReason?: string;
  creditOverrideRequestedAt?: string;
  creditOverrideApprovedBy?: string;
}

export interface CreditOverrideRequest {
  id: string;
  customerId: string;
  customerName: string;
  requestedBy: string;
  currentDebt: number;
  creditLimit: number;
  overdueDays: number;
  reason: string;
  requestedAmount: number;
  requestedAt: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  reviewedBy?: string;
  reviewedAt?: string;
  rejectReason?: string;
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
  unitVolumeLiters?: number;
}

export interface Order {
  id: string;
  customer: string;
  customerId?: string;
  customerType?: CustomerType;
  total: number;
  status: OrderStatus;
  discountPercent?: number;
  discountAmount?: number;
  promotionNotes?: string;
  totalLiters?: number;
  items?: OrderItem[];
  createdAt?: string;
  isOverCredit?: boolean;
  creditApprovedBy?: string;
  isCreditOverride?: boolean;
  creditOverrideReason?: string;
  creditOverrideStatus?: 'PENDING' | 'APPROVED' | 'REJECTED';
  creditOverrideApprovedBy?: string;
  drumDelivered?: number;
  drumReturned?: number;
  drumDepositAmount?: number;
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
