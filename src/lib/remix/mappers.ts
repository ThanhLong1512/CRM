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
} from "@/types";
import type { OrderStatus as PrismaOrderStatus } from "@prisma/client";

export function formatVND(amount: number): string {
  return new Intl.NumberFormat("vi-VN").format(amount) + " đ";
}

export function volumeToPackageType(
  volume: string | null | undefined,
): PackageType {
  const liters = parseProductLiters(volume);
  if (liters >= 150) return "Phuy 200L";
  if (liters >= 10) return "Thùng 18L";
  if (liters >= 3) return "Xô 4L";
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
    case "CANCELLED":
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
      return "SHIPPED";
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
    priceDealer: unitPrice,
    priceMechanic: unitPrice,
    priceFleet: unitPrice,
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
    route: "",
    creditLimit: dto.creditLimit,
    currentDebt: dto.currentDebt,
    emptyDrums: dto.outstandingDrums ?? 0,
    drumBalance: dto.outstandingDrums ?? 0,
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
    createdAt: dto.createdAt,
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
