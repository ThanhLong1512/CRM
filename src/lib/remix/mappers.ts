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

export function formatMoney(amount: number | string | null | undefined): string {
  if (amount === null || amount === undefined || amount === "") return "0";
  const num = Math.round(Number(amount));
  if (isNaN(num)) return "0";
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

export function formatVND(amount: number | string | null | undefined, includeUnit: boolean = true): string {
  const formatted = formatMoney(amount);
  return includeUnit ? `${formatted} đ` : formatted;
}

export function volumeToPackageType(
  volume: string | null | undefined,
  name?: string,
): PackageType {
  const n = (name || "").toLowerCase();
  if (n.includes("phuy 200l") || volume === "200") return "Phuy 200L";
  if (n.includes("phuy 208l") || volume === "208") return "Phuy 208L";
  if (n.includes("thùng 18l")) return "Thùng 18L";
  if (n.includes("xô 18l")) return "Xô 18L";
  if (n.includes("xô 4l")) return "Xô 4L";
  if (n.includes("can 4l")) return "Can 4L";

  const liters = parseProductLiters(volume);
  if (liters >= 205) return "Phuy 208L";
  if (liters >= 150) return "Phuy 200L";
  if (liters >= 15) return "Thùng 18L";
  if (liters >= 3) return "Can 4L";
  return "Chai 1L";
}

export function inferProductCategory(name: string, viscosity?: string | null): string {
  const n = (name || "").toLowerCase();
  const v = (viscosity || "").toLowerCase();
  if (n.includes("diesel") || v.includes("ci-4") || v.includes("ck-4")) return "Dầu động cơ diesel";
  if (n.includes("thủy lực") || n.includes("hydraulic") || v.includes("iso vg") || v.includes("hlp")) return "Dầu thủy lực công nghiệp";
  if (n.includes("hộp số") || n.includes("cầu") || n.includes("atf") || n.includes("gear") || v.includes("gl-5")) return "Dầu hộp số & cầu";
  if (n.includes("xe máy") || n.includes("20w-50") || v.includes("ma2")) return "Dầu động cơ xe máy";
  if (n.includes("làm mát") || n.includes("coolant") || n.includes("phụ gia")) return "Nước làm mát & phụ gia";
  if (n.includes("ô tô") || n.includes("du lịch") || n.includes("hybrid") || v.includes("0w-20") || v.includes("5w-30") || v.includes("10w-40")) return "Dầu động cơ ô tô du lịch";
  return "Dầu nhớt chuyên dụng";
}

export function inferProductBrand(name: string, sku: string): string {
  const n = (name || "").toLowerCase();
  if (n.includes("bluetech") || sku.startsWith("BLT")) return "BlueTech";
  if (n.includes("castrol")) return "Castrol";
  if (n.includes("shell")) return "Shell";
  if (n.includes("motul")) return "Motul";
  if (n.includes("total")) return "TotalEnergies";
  if (n.includes("caltex") || n.includes("delo")) return "Caltex";
  return "Đại An Lube";
}

export function inferBaseOil(name: string): "Khoáng" | "Bán tổng hợp" | "Tổng hợp toàn phần" {
  const n = (name || "").toLowerCase();
  if (n.includes("full synthetic") || n.includes("toàn phần")) return "Tổng hợp toàn phần";
  if (n.includes("semi-synthetic") || n.includes("bán tổng hợp")) return "Bán tổng hợp";
  return "Khoáng";
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
    packageType: volumeToPackageType(dto.volume, dto.name),
    viscosity: dto.viscosity ?? "",
    standards: dto.standard ?? "",
    baseOil: inferBaseOil(dto.name),
    drumReturnable: dto.isDrum,
    priceDealer: wholesalePrice,
    priceMechanic: garagePrice,
    priceFleet: unitPrice,
    wholesalePrice,
    garagePrice,
    retailPrice,
    volumeLiters: dto.volumeLiters ?? parseProductLiters(dto.volume),
    stock: dto.stock,
    minSafeStock: 10,
    maxStock: Math.max(dto.stock, 100),
    vatPercent: 10,
    brand: inferProductBrand(dto.name, dto.sku),
    category: inferProductCategory(dto.name, dto.viscosity),
    isForSale: true,
  };
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


export function mapCustomerDto(
  dto: CustomerDto,
  rfm?: RfmCustomerDto,
): Customer {
  const hasGps = dto.lat != null && dto.lng != null;
  const visitDates = dto.visitDates ?? [];
  const visitPlans = dto.visitPlans ?? [];
  const nextVisit = visitDates[0];
  const routeLabel =
    visitDates.length > 0
      ? nextVisit
        ? `Lịch ghé: ${visitDates.length} ngày (gần nhất ${nextVisit})`
        : "Có lịch ghé"
      : "Chưa có lịch ghé";

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
    route: routeLabel,
    visitDates,
    visitPlans,
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
