import type { ProductDto } from "@/app/(private)/san-pham/product-query";
import type { CustomerDto } from "@/app/(private)/khach-hang/customer-query";
import type { OrderDto } from "@/app/(private)/don-hang/order-query";
import type { FleetVehicleDto } from "@/lib/data/fleet";
import type { DrumTxnDto } from "@/lib/data/drums";
import type { RfmCustomerDto, RfmOverview } from "@/lib/data/rfm";
import { parseProductLiters } from "@/lib/data/dashboard";
import type {
  Customer,
  CustomerType,
  DrumTransaction,
  FleetVehicle,
  Order,
  OrderStatus,
  PackageType,
  Product,
  VisitDayOfWeek,
} from "@/types";
import type { OrderStatus as PrismaOrderStatus } from "@prisma/client";

export function formatVND(amount: number): string {
  return new Intl.NumberFormat("vi-VN").format(amount) + " đ";
}

export function volumeToPackageType(
  volume: string | null | undefined,
): PackageType {
  const liters = parseProductLiters(volume);
  if (liters >= 150) return "Phuy 208L";
  if (liters >= 10) return "Xô 18L";
  if (liters >= 3) return "Can 4L";
  return "Chai 1L";
}

export function mapCustomerType(type: "GARAGE" | "FLEET"): CustomerType {
  return type === "FLEET" ? "Đội xe" : "Đại lý";
}

export function mapPrismaOrderStatus(
  status: PrismaOrderStatus | string,
): OrderStatus {
  switch (status) {
    case "PENDING":
      return "Chờ duyệt";
    case "CONFIRMED":
      return "Xuất kho";
    case "SHIPPED":
      return "Giao hàng";
    case "DELIVERED":
      return "Hoàn thành";
    default:
      return "Chờ duyệt";
  }
}

export function mapRemixOrderStatusToPrisma(
  status: OrderStatus,
): PrismaOrderStatus {
  switch (status) {
    case "Chờ duyệt":
      return "PENDING";
    case "Xuất kho":
      return "CONFIRMED";
    case "Giao hàng":
      return "SHIPPED";
    case "Hoàn thành":
      return "DELIVERED";
    default:
      return "PENDING";
  }
}

function mapRfmSegment(
  segment: RfmCustomerDto["segment"] | undefined,
): Customer["rfmSegment"] {
  switch (segment) {
    case "VIP":
      return "VIP";
    case "CHURN_RISK":
      return "At Risk";
    case "POTENTIAL":
      return "Potential";
    case "NEW_LOW":
    case "STABLE":
      return "Stable";
    default:
      return undefined;
  }
}

export function mapProductDto(dto: ProductDto): Product {
  const unitPrice = dto.unitPrice;
  const wholesalePrice = dto.wholesalePrice ?? unitPrice;
  const garagePrice = dto.garagePrice ?? unitPrice;
  const retailPrice = dto.retailPrice ?? Math.round(unitPrice * 1.15);
  return {
    id: dto.id,
    name: dto.name,
    sku: dto.sku,
    unit: "Lít",
    packageType: volumeToPackageType(dto.volume),
    viscosity: dto.viscosity ?? "",
    standards: dto.standard ?? "",
    baseOil: "Khoáng",
    drumReturnable: dto.isDrum,
    priceDealer: wholesalePrice,
    priceMechanic: garagePrice,
    priceFleet: unitPrice,
    wholesalePrice,
    garagePrice,
    retailPrice,
    volumeLiters: dto.volumeLiters ?? parseProductLiters(dto.volume),
    stock: dto.stock,
    minSafeStock: 0,
    maxStock: Math.max(dto.stock, 100),
    vatPercent: 10,
    brand: "",
    category: "",
    isForSale: true,
  };
}

export function mapCustomerDto(
  dto: CustomerDto,
  rfm?: RfmCustomerDto,
): Customer {
  const hasGps = dto.lat != null && dto.lng != null;
  const visitDay = dto.visitDay ?? undefined;
  const routeNames = {
    T2: "Tuyến T2: QL1A - Hóc Môn - Q12",
    T3: "Tuyến T3: KCN Tân Bình - Vĩnh Lộc",
    T4: "Tuyến T4: Bình Tân - Quận 6",
    T5: "Tuyến T5: Củ Chi - Hóc Môn",
    T6: "Tuyến T6: Cảng Cát Lái - TP. Thủ Đức",
    T7: "Tuyến T7: Chăm sóc Đại lý VIP",
  } as const;

  return {
    id: dto.id,
    name: dto.name,
    code: dto.id.slice(-6).toUpperCase(),
    type: mapCustomerType(dto.type),
    phone: dto.phone ?? undefined,
    address: dto.address ?? "",
    lat: dto.lat ?? 0,
    lng: dto.lng ?? 0,
    hasGps,
    route: visitDay ? routeNames[visitDay] : "Chưa gán ngày ghé",
    visitDay,
    visitDays: dto.visitDays && dto.visitDays.length > 0
      ? (dto.visitDays as VisitDayOfWeek[])
      : visitDay
        ? [visitDay]
        : [],
    visitFrequency: "WEEKLY",
    creditLimit: dto.creditLimit,
    creditTermDays: dto.creditTermDays ?? 30,
    currentDebt: dto.currentDebt,
    debtAging: dto.debtAging,
    emptyDrums: dto.outstandingDrums ?? 0,
    drumBalance: dto.outstandingDrums ?? 0,
    dealerTier: dto.dealerTier ?? "RETAIL",
    creditOverridden: dto.creditOverridden,
    creditOverrideReason: dto.creditOverrideReason ?? undefined,
    creditOverrideApprovedBy: dto.creditOverrideApprovedBy ?? undefined,
    loyaltyPoints: 0,
    lastPurchaseDaysAgo: rfm?.recencyDays ?? 999,
    rfmSegment: mapRfmSegment(rfm?.segment),
  };
}

export function mapOrderDto(dto: OrderDto): Order {
  return {
    id: dto.id,
    customer: dto.customerName,
    customerId: dto.customerId,
    customerType: mapCustomerType(dto.customerType),
    total: dto.total,
    status: mapPrismaOrderStatus(dto.status),
    discountPercent: dto.discountPercent,
    discountAmount: dto.discountAmount,
    promotionNotes: dto.promotionNotes ?? undefined,
    totalLiters: dto.totalLiters,
    createdAt: dto.createdAt,
    drumDelivered: dto.drumDelivered,
    drumReturned: dto.drumReturned,
    drumDepositAmount: dto.drumDepositAmount,
    isCreditOverride: dto.isCreditOverride,
    creditOverrideReason: dto.creditOverrideReason ?? undefined,
    creditOverrideStatus: dto.creditOverrideStatus ?? undefined,
    creditOverrideApprovedBy: dto.creditOverrideApprovedBy ?? undefined,
    items: dto.items.map((item) => ({
      productId: item.productId,
      productName: item.productName,
      sku: item.productSku,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      total: item.lineTotal,
    })),
  };
}

export function mapFleetVehicleDto(dto: FleetVehicleDto): FleetVehicle {
  const nextOilChangeKm = dto.lastServiceMeter + dto.intervalValue;
  const statusMap = {
    GREEN: "Xanh" as const,
    YELLOW: "Vàng" as const,
    RED: "Đỏ" as const,
  };
  return {
    id: dto.id,
    customerId: dto.customerId,
    customerName: dto.customerName,
    vehicleType: dto.label ?? "Xe",
    plate: dto.plateNumber,
    currentKm: dto.currentMeter,
    nextOilChangeKm,
    recommendedOil: dto.notes ?? "",
    status: statusMap[dto.level] ?? "Xanh",
    oilLifePercent: Math.round(dto.percent),
  };
}

export function mapDrumTxnDto(
  dto: DrumTxnDto,
  balanceAfter = 0,
): DrumTransaction {
  const delivered = dto.type === "ISSUE" ? dto.quantity : 0;
  const returned =
    dto.type === "RETURN"
      ? dto.quantity
      : dto.type === "ADJUST" && dto.quantity < 0
        ? Math.abs(dto.quantity)
        : 0;
  return {
    id: dto.id,
    customerId: dto.customerId,
    customerName: "",
    delivered,
    returned,
    balanceAfter,
    timestamp: new Date(dto.createdAt).toLocaleString("vi-VN"),
  };
}

export function mapCustomersWithRfm(
  customers: CustomerDto[],
  rfm: RfmOverview,
): Customer[] {
  const byId = new Map(rfm.customers.map((c) => [c.customerId, c]));
  return customers.map((c) => mapCustomerDto(c, byId.get(c.id)));
}

export function mapDrumTransactionsWithNames(
  txns: DrumTxnDto[],
  customers: CustomerDto[],
): DrumTransaction[] {
  const nameById = new Map(customers.map((c) => [c.id, c.name]));
  return txns.map((txn) => {
    const mapped = mapDrumTxnDto(txn, 0);
    return {
      ...mapped,
      customerName: nameById.get(txn.customerId) ?? "—",
      balanceAfter:
        customers.find((c) => c.id === txn.customerId)?.outstandingDrums ?? 0,
    };
  });
}
