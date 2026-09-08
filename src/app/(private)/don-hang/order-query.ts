export type OrderStatusDto =
  | "DRAFT"
  | "PENDING"
  | "CONFIRMED"
  | "SHIPPED"
  | "CANCELLED";

export type OrderItemDto = {
  id: string;
  productId: string;
  productName: string;
  productSku: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
};

export type OrderDto = {
  id: string;
  status: OrderStatusDto;
  customerId: string;
  customerName: string;
  customerType: "GARAGE" | "FLEET";
  userName: string | null;
  userEmail: string;
  total: number;
  rawTotal?: number;
  discountPercent?: number;
  discountAmount?: number;
  promotionNotes?: string | null;
  totalLiters?: number;
  itemCount: number;
  items: OrderItemDto[];
  createdAt: string;
  updatedAt: string;
};

export const ORDERS_QUERY_KEY = ["orders"] as const;

export async function fetchOrders(): Promise<OrderDto[]> {
  const res = await fetch("/api/orders", {
    method: "GET",
    credentials: "same-origin",
  });

  if (!res.ok) {
    throw new Error("Không tải được danh sách đơn hàng.");
  }

  return res.json() as Promise<OrderDto[]>;
}

export type OrderStatusFilter = "all" | OrderStatusDto;

export function filterOrders(
  orders: OrderDto[],
  opts: {
    query: string;
    status: OrderStatusFilter;
  },
): OrderDto[] {
  const q = opts.query.trim().toLowerCase();

  return orders.filter((order) => {
    if (opts.status !== "all" && order.status !== opts.status) return false;

    if (q) {
      const haystack = [
        order.id,
        order.customerName,
        order.customerType,
        order.userName ?? "",
        order.userEmail,
        order.status,
        ...order.items.map((item) => `${item.productName} ${item.productSku}`),
      ]
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(q)) return false;
    }

    return true;
  });
}

export function statusLabel(status: OrderStatusDto): string {
  switch (status) {
    case "DRAFT":
      return "Nháp";
    case "PENDING":
      return "Chờ duyệt";
    case "CONFIRMED":
      return "Xuất kho";
    case "SHIPPED":
      return "Đã giao";
    case "CANCELLED":
      return "Đã hủy";
    default:
      return status;
  }
}
