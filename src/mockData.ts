import { Product, Customer, FleetVehicle, Order, DrumTransaction, SalesStaff } from './types';

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: "P01",
    name: "Dầu Động Cơ Diesel Turbo 15W-40 CI-4 Phuy 200L",
    sku: "DN-15W40-200L",
    brand: "Castrol",
    category: "Dầu động cơ diesel",
    packageType: "Phuy 200L",
    unit: "Phuy (200L)",
    viscosity: "15W-40",
    standards: "API CI-4 / ACEA E7",
    baseOil: "Bán tổng hợp",
    drumReturnable: true,
    priceDealer: 11800000,
    priceMechanic: 12500000,
    priceFleet: 12100000,
    stock: 18,
    minSafeStock: 5,
    maxStock: 30,
    vatPercent: 8,
    isForSale: true,
  },
  {
    id: "P02",
    name: "Dầu Động Cơ Diesel Turbo 15W-40 CI-4 Thùng 18L",
    sku: "DN-15W40-18L",
    brand: "Castrol",
    category: "Dầu động cơ diesel",
    packageType: "Thùng 18L",
    unit: "Thùng (18L)",
    viscosity: "15W-40",
    standards: "API CI-4 / ACEA E7",
    baseOil: "Bán tổng hợp",
    drumReturnable: false,
    priceDealer: 1350000,
    priceMechanic: 1450000,
    priceFleet: 1400000,
    stock: 85,
    minSafeStock: 20,
    maxStock: 150,
    vatPercent: 8,
    isForSale: true,
  },
  {
    id: "P03",
    name: "Dầu Cầu & Hộp Số Bánh Răng 80W-90 GL-5",
    sku: "DN-GEAR-80W90",
    brand: "Eneos",
    category: "Dầu hộp số & cầu",
    packageType: "Xô 4L",
    unit: "Xô (4L)",
    viscosity: "80W-90",
    standards: "API GL-5 / MT-1",
    baseOil: "Khoáng",
    drumReturnable: false,
    priceDealer: 360000,
    priceMechanic: 390000,
    priceFleet: 375000,
    stock: 140,
    minSafeStock: 25,
    maxStock: 200,
    vatPercent: 8,
    isForSale: true,
  },
  {
    id: "P04",
    name: "Dầu Động Cơ Ô Tô Du Lịch 5W-30 Full Synthetic",
    sku: "DN-5W30-4L",
    brand: "Mobil 1",
    category: "Dầu động cơ xăng",
    packageType: "Xô 4L",
    unit: "Can (4L)",
    viscosity: "5W-30",
    standards: "API SP / ILSAC GF-6A",
    baseOil: "Tổng hợp toàn phần",
    drumReturnable: false,
    priceDealer: 680000,
    priceMechanic: 750000,
    priceFleet: 710000,
    stock: 110,
    minSafeStock: 30,
    maxStock: 180,
    vatPercent: 8,
    isForSale: true,
  },
  {
    id: "P05",
    name: "Dầu Động Cơ Bán Tổng Hợp 10W-40 Semi-Synthetic",
    sku: "DN-10W40-4L",
    brand: "Motul",
    category: "Dầu động cơ xăng",
    packageType: "Xô 4L",
    unit: "Can (4L)",
    viscosity: "10W-40",
    standards: "API SN / ACEA A3/B4",
    baseOil: "Bán tổng hợp",
    drumReturnable: false,
    priceDealer: 420000,
    priceMechanic: 470000,
    priceFleet: 440000,
    stock: 95,
    minSafeStock: 20,
    maxStock: 160,
    vatPercent: 8,
    isForSale: true,
  },
  {
    id: "P06",
    name: "Dầu Thủy Lực Công Nghiệp Hydraulic ISO VG 68 Phuy",
    sku: "DN-HYD-68-200L",
    brand: "Shell",
    category: "Dầu thủy lực công nghiệp",
    packageType: "Phuy 200L",
    unit: "Phuy (200L)",
    viscosity: "ISO VG 68",
    standards: "DIN 51524 HLP / ISO 11158",
    baseOil: "Khoáng",
    drumReturnable: true,
    priceDealer: 9800000,
    priceMechanic: 10400000,
    priceFleet: 10000000,
    stock: 8,
    minSafeStock: 10,
    maxStock: 25,
    vatPercent: 8,
    isForSale: true,
  },
  {
    id: "P07",
    name: "Dầu Hộp Số Tự Động Cao Cấp ATF Dexron VI",
    sku: "DN-ATF-1L",
    brand: "TotalEnergies",
    category: "Dầu hộp số & cầu",
    packageType: "Chai 1L",
    unit: "Chai (1L)",
    viscosity: "ATF",
    standards: "GM Dexron VI / Mercon LV",
    baseOil: "Tổng hợp toàn phần",
    drumReturnable: false,
    priceDealer: 180000,
    priceMechanic: 210000,
    priceFleet: 195000,
    stock: 220,
    minSafeStock: 40,
    maxStock: 300,
    vatPercent: 8,
    isForSale: true,
  },
  {
    id: "P08",
    name: "Nước Làm Mát Động Cơ BlueTech Long Life Coolant 50/50",
    sku: "BLT-COOL-5L",
    brand: "BlueTech",
    category: "Nước làm mát & phụ gia",
    packageType: "Xô 4L",
    unit: "Can (5L)",
    viscosity: "50/50 Pre-mix",
    standards: "JIS K 2234 / ASTM D3306",
    baseOil: "Khoáng",
    drumReturnable: false,
    priceDealer: 190000,
    priceMechanic: 220000,
    priceFleet: 205000,
    stock: 310,
    minSafeStock: 50,
    maxStock: 400,
    vatPercent: 8,
    isForSale: true,
  },
  {
    id: "P09",
    name: "Dầu Động Cơ Xe Máy 4 Thì 20W-50 Mineral",
    sku: "DN-20W50-1L",
    brand: "Castrol",
    category: "Dầu động cơ xe máy",
    packageType: "Chai 1L",
    unit: "Chai (1L)",
    viscosity: "20W-50",
    standards: "API SJ / JASO MA2",
    baseOil: "Khoáng",
    drumReturnable: false,
    priceDealer: 85000,
    priceMechanic: 98000,
    priceFleet: 90000,
    stock: 450,
    minSafeStock: 100,
    maxStock: 600,
    vatPercent: 8,
    isForSale: true,
  }
];

export const INITIAL_CUSTOMERS: Customer[] = [
  {
    id: "C01",
    name: "Garage Minh Đức",
    code: "GAR-MD01",
    type: "Đại lý", // GARAGE
    phone: "0909123456",
    address: "12 Nguyễn Văn Linh, Q.7, TP.HCM",
    lat: 10.732534,
    lng: 106.702049,
    hasGps: true,
    route: "Tuyến T2: Q7 - Nhà Bè - Bình Chánh",
    creditLimit: 50000000,
    currentDebt: 42500000, // 85% - warning!
    emptyDrums: 4,
    lastPurchaseDaysAgo: 17,
    avgCycleDays: 18, // Alarm: 17/18 days!
    favoriteSku: "DN-15W40-18L",
    rfmSegment: "VIP",
  },
  {
    id: "C02",
    name: "Đội Xe Logistics Demo",
    code: "FLT-LOG02",
    type: "Đội xe", // FLEET
    phone: "0909888777",
    address: "KCN Tân Bình, P. Tây Thạnh, Q. Tân Phú, TP.HCM",
    lat: 10.818218,
    lng: 106.634120,
    hasGps: true,
    route: "Tuyến T3: KCN Tân Bình - Vĩnh Lộc",
    creditLimit: 100000000,
    currentDebt: 94000000, // 94% - critical near ceiling!
    emptyDrums: 12,
    lastPurchaseDaysAgo: 3,
    avgCycleDays: 12,
    favoriteSku: "DN-15W40-200L",
    rfmSegment: "VIP",
  },
  {
    id: "C03",
    name: "Garage Ô Tô Tân Phú",
    code: "GAR-TP03",
    type: "Đại lý", // GARAGE
    phone: "0348859482",
    address: "88 Đường Tân Kỳ Tân Quý, P. Sơn Kỳ, Q. Tân Phú",
    lat: 10.804122,
    lng: 106.621450,
    hasGps: true,
    route: "Tuyến T3: KCN Tân Bình - Vĩnh Lộc",
    creditLimit: 20000000,
    currentDebt: 6500000, // 32.5% - good health
    emptyDrums: 2,
    lastPurchaseDaysAgo: 9,
    avgCycleDays: 20,
    favoriteSku: "DN-5W30-4L",
    rfmSegment: "Stable",
  },
  {
    id: "C04",
    name: "Tiệm Sửa Xe Chú Ba",
    code: "MEC-BA04",
    type: "Thợ", // MECHANIC
    phone: "0918334455",
    address: "89 Lê Văn Sỹ, P.13, Q.3, TP.HCM",
    lat: 10.785400,
    lng: 106.680000,
    hasGps: true,
    route: "Tuyến T4: Q3 - Q10 - Phú Nhuận",
    creditLimit: 10000000,
    currentDebt: 0,
    emptyDrums: 0,
    loyaltyPoints: 1250,
    lastPurchaseDaysAgo: 48, // > 45 days -> AT RISK!
    avgCycleDays: 25,
    favoriteSku: "DN-20W50-1L",
    rfmSegment: "At Risk",
  },
  {
    id: "C05",
    name: "Nhà Phân Phối Phụ Tùng Miền Nam",
    code: "DLR-MN05",
    type: "Đại lý", // DEALER
    phone: "0903112233",
    address: "QL1A, Xã Bình Chánh, H. Bình Chánh, TP.HCM",
    lat: 10.685412,
    lng: 106.582144,
    hasGps: false, // Needs check-in pin!
    route: "Tuyến T2: Q7 - Nhà Bè - Bình Chánh",
    creditLimit: 200000000,
    currentDebt: 68000000,
    emptyDrums: 18,
    lastPurchaseDaysAgo: 2,
    avgCycleDays: 8,
    favoriteSku: "DN-HYD-68-200L",
    rfmSegment: "VIP",
  }
];

export const INITIAL_FLEET_VEHICLES: FleetVehicle[] = [
  {
    id: "V01",
    customerId: "C02",
    customerName: "Đội Xe Logistics Demo",
    vehicleType: "Xe tải nặng 10 tấn (Hino 500)",
    plate: "51C-123.45",
    currentKm: 7000,
    nextOilChangeKm: 10000,
    recommendedOil: "Dầu động cơ Turbo Diesel 15W-40 (Cần 18 Lít)",
    oilCapacityLiters: 18,
    status: "Xanh",
    oilLifePercent: 30, // 3.000km remaining (30%)
  },
  {
    id: "V02",
    customerId: "C02",
    customerName: "Đội Xe Logistics Demo",
    vehicleType: "Xe đầu kéo Container 40ft (Freightliner)",
    plate: "51C-678.90",
    currentKm: 9650,
    nextOilChangeKm: 10000,
    recommendedOil: "Dầu động cơ Turbo Diesel 15W-40 (Cần 36 Lít)",
    oilCapacityLiters: 36,
    status: "Vàng", // < 500km remaining -> Cảnh báo sớm!
    oilLifePercent: 4,
  },
  {
    id: "V03",
    customerId: "C02",
    customerName: "Đội Xe Logistics Demo",
    vehicleType: "Xe tải trung 5 tấn (Isuzu Forward)",
    plate: "51D-889.99",
    currentKm: 10850,
    nextOilChangeKm: 10000,
    recommendedOil: "Dầu động cơ Turbo Diesel 15W-40 (Cần 14 Lít)",
    oilCapacityLiters: 14,
    status: "Đỏ", // Overdue by 850km! Báo động đỏ!
    oilLifePercent: 0,
  }
];

export const INITIAL_ORDERS: Order[] = [
  {
    id: "ORD-2026-001",
    customer: "Garage Minh Đức",
    customerId: "C01",
    customerType: "Đại lý",
    total: 14500000,
    status: "Chờ duyệt",
    createdAt: "2026-09-07 09:15",
    isOverCredit: true, // Over limit warning!
    creditApprovedBy: undefined,
    pickingDetails: {
      drums200L: 1,
      pails18L: 2,
      bottles: 0,
    },
    drumExchange: {
      delivered: 1,
      returned: 0,
    },
    items: [
      {
        productId: "P01",
        productName: "Dầu Động Cơ Diesel Turbo 15W-40 CI-4 Phuy 200L",
        sku: "DN-15W40-200L",
        packageType: "Phuy 200L",
        quantity: 1,
        unitPrice: 12500000,
        total: 12500000,
      },
      {
        productId: "P02",
        productName: "Dầu Động Cơ Diesel Turbo 15W-40 CI-4 Thùng 18L",
        sku: "DN-15W40-18L",
        packageType: "Thùng 18L",
        quantity: 2,
        unitPrice: 1000000,
        total: 2000000,
      }
    ],
    gpsVerification: {
      lat: 10.732530,
      lng: 106.702040,
      offsetMeters: 12,
      timestamp: "2026-09-07 09:14:22",
      verified: true,
    }
  },
  {
    id: "ORD-2026-002",
    customer: "Đội Xe Logistics Demo",
    customerId: "C02",
    customerType: "Đội xe",
    total: 27000000,
    status: "Xuất kho",
    createdAt: "2026-09-07 08:30",
    isOverCredit: false,
    pickingDetails: {
      drums200L: 2,
      pails18L: 2,
      bottles: 0,
    },
    drumExchange: {
      delivered: 2,
      returned: 1,
    },
    items: [
      {
        productId: "P01",
        productName: "Dầu Động Cơ Diesel Turbo 15W-40 CI-4 Phuy 200L",
        sku: "DN-15W40-200L",
        packageType: "Phuy 200L",
        quantity: 2,
        unitPrice: 12100000,
        total: 24200000,
      },
      {
        productId: "P02",
        productName: "Dầu Động Cơ Diesel Turbo 15W-40 CI-4 Thùng 18L",
        sku: "DN-15W40-18L",
        packageType: "Thùng 18L",
        quantity: 2,
        unitPrice: 1400000,
        total: 2800000,
      }
    ]
  },
  {
    id: "ORD-2026-003",
    customer: "Nhà Phân Phối Phụ Tùng Miền Nam",
    customerId: "C05",
    customerType: "Đại lý",
    total: 19600000,
    status: "Giao hàng",
    createdAt: "2026-09-06 15:40",
    driverName: "Trần Văn Toàn (Tài xế giao vận 01)",
    driverPhone: "0988112233",
    pickingDetails: {
      drums200L: 2,
      pails18L: 0,
      bottles: 0,
    },
    drumExchange: {
      delivered: 2,
      returned: 2,
    },
    items: [
      {
        productId: "P06",
        productName: "Dầu Thủy Lực Công Nghiệp Hydraulic ISO VG 68 Phuy",
        sku: "DN-HYD-68-200L",
        packageType: "Phuy 200L",
        quantity: 2,
        unitPrice: 9800000,
        total: 19600000,
      }
    ]
  },
  {
    id: "ORD-2026-004",
    customer: "Garage Ô Tô Tân Phú",
    customerId: "C03",
    customerType: "Đại lý",
    total: 4500000,
    status: "Hoàn thành",
    createdAt: "2026-09-05 11:20",
    signature: "Ký nhận: Lê Văn Hải (Chủ Garage)",
    drumExchange: {
      delivered: 0,
      returned: 1,
    },
    items: [
      {
        productId: "P04",
        productName: "Dầu Động Cơ Ô Tô Du Lịch 5W-30 Full Synthetic",
        sku: "DN-5W30-4L",
        packageType: "Xô 4L",
        quantity: 6,
        unitPrice: 750000,
        total: 4500000,
      }
    ]
  }
];

export const INITIAL_DRUM_TRANSACTIONS: DrumTransaction[] = [
  {
    id: "DT-01",
    customerId: "C01",
    customerName: "Garage Minh Đức",
    delivered: 4,
    returned: 0,
    balanceAfter: 4,
    depositValue: 1600000, // 4 * 400.000đ
    timestamp: "2026-09-01 10:30",
    signedBy: "Trần Minh Đức",
  },
  {
    id: "DT-02",
    customerId: "C02",
    customerName: "Đội Xe Logistics Demo",
    delivered: 15,
    returned: 3,
    balanceAfter: 12,
    depositValue: 4800000,
    timestamp: "2026-09-03 14:15",
    signedBy: "Nguyễn Hoàng Nam (Quản lý đội xe)",
  },
  {
    id: "DT-03",
    customerId: "C05",
    customerName: "Nhà Phân Phối Phụ Tùng Miền Nam",
    delivered: 20,
    returned: 2,
    balanceAfter: 18,
    depositValue: 7200000,
    timestamp: "2026-09-05 16:00",
    signedBy: "Vũ Đình Trọng",
  }
];

export const INITIAL_SALES_STAFF: SalesStaff[] = [
  {
    id: "NV-08",
    name: "Nguyễn Văn A",
    code: "SALES-08",
    role: "Sales Thị Trường (Kênh Garage & Thợ)",
    phone: "0908123456",
    assignedRoute: "Tuyến T2: Q7 - Nhà Bè - Bình Chánh",
    todayVisits: {
      completed: 12,
      total: 15,
    },
    mtdRevenue: 148000000,
    mtdTarget: 180000000,
    debtCollected: 42500000,
    lastCheckIn: {
      customerName: "Garage Minh Đức",
      time: "10:15 Sáng nay",
      coords: "10.732534, 106.702049",
    },
    permissions: {
      approveOverCredit: false,
      createSpecialPromo: false,
      editGpsCoords: true,
      drumOffset: true,
      viewCostPrice: false,
    }
  },
  {
    id: "NV-02",
    name: "Trần Thị Mai",
    code: "SALES-02",
    role: "Key Account Manager (Kênh FLEET & Logistics)",
    phone: "0912345678",
    assignedRoute: "Tuyến T3: KCN Tân Bình - Vĩnh Lộc",
    todayVisits: {
      completed: 8,
      total: 10,
    },
    mtdRevenue: 295000000,
    mtdTarget: 320000000,
    debtCollected: 94000000,
    lastCheckIn: {
      customerName: "Đội Xe Logistics Demo",
      time: "08:45 Sáng nay",
      coords: "10.818218, 106.634120",
    },
    permissions: {
      approveOverCredit: true,
      createSpecialPromo: true,
      editGpsCoords: true,
      drumOffset: true,
      viewCostPrice: true,
    }
  },
  {
    id: "NV-05",
    name: "Lê Quốc Bảo",
    code: "SALES-05",
    role: "Sales Thị Trường (Kênh Đại Lý Phụ Tùng)",
    phone: "0934567890",
    assignedRoute: "Tuyến T4: Q3 - Q10 - Phú Nhuận",
    todayVisits: {
      completed: 9,
      total: 12,
    },
    mtdRevenue: 98000000,
    mtdTarget: 140000000,
    debtCollected: 18500000,
    lastCheckIn: {
      customerName: "Tiệm Sửa Xe Chú Ba",
      time: "Hôm qua",
      coords: "10.785400, 106.680000",
    },
    permissions: {
      approveOverCredit: false,
      createSpecialPromo: false,
      editGpsCoords: false,
      drumOffset: true,
      viewCostPrice: false,
    }
  }
];

// Haversine formula to calculate distance in meters between two lat/lng coordinates
export function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

// Format Currency in Vietnamese Dong
export function formatVND(amount: number): string {
  return new Intl.NumberFormat('vi-VN').format(amount) + ' đ';
}
