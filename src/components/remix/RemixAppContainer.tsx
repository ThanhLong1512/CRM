"use client";

import { useState, useEffect, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  LayoutDashboard,
  Users,
  ShoppingCart,
  Layers,
  Menu,
} from "lucide-react";
import {
  Product,
  Customer,
  FleetVehicle,
  Order,
  OrderStatus,
  DrumTransaction,
  NavigationModule,
  CreditOverrideRequest,
} from "@/types";
import { soundFX } from "@/components/utils/audio";
import type { DashboardOverview } from "@/lib/data/dashboard";
import type { DrumStats } from "@/lib/data/drums";
import type { RfmOverview } from "@/lib/data/rfm";
import type { RemixStaffUser } from "@/lib/remix/load-bootstrap";
import { mapRemixOrderStatusToPrisma } from "@/lib/remix/mappers";
import {
  createOrder,
  updateOrderStatus,
  cancelOrder,
  approveCreditOverride,
  rejectCreditOverride,
} from "@/app/(private)/don-hang/actions";
import {
  createProduct,
  deleteProduct,
  updateProduct,
} from "@/app/(private)/san-pham/actions";
import { updateCustomer, createCustomer, deleteCustomer } from "@/app/(private)/khach-hang/actions";
import { createCheckIn } from "@/app/(private)/sales/actions";
import { issueDrums, returnDrums, adjustDrums } from "@/app/(private)/vo-phuy/actions";
import {
  createVehicle,
  updateMeter,
  recordOilChange,
  deleteVehicle,
} from "@/app/(private)/fleet/actions";
import type { CustomerFormInput } from "@/components/remix/CustomersView";
import { updateUserRole } from "@/app/(private)/nhan-su/actions";
import {
  findOrCreateMechanic,
  scanLoyaltyCode,
} from "@/app/(private)/tich-diem/actions";
import type { UserRole } from "@prisma/client";

import Sidebar from "./Sidebar";
import Header from "./Header";
import type { AuthUserProfile } from "@/components/auth/authData";
import { DEMO_USERS } from "@/components/auth/authData";
import DashboardView from "./DashboardView";
import ProductsView from "./ProductsView";
import CustomersView from "./CustomersView";
import SalesPWAView from "./SalesPWAView";
import FleetView from "./FleetView";
import LoyaltyQRView from "./LoyaltyQRView";
import DrumsView from "./DrumsView";
import KanbanView from "./KanbanView";
import StaffRBACView from "./StaffRBACView";
import SettingsView from "./SettingsView";

export type RemixAppContainerProps = {
  initialModule?: NavigationModule;
  initialProducts?: Product[];
  initialCustomers?: Customer[];
  initialOrders?: Order[];
  initialVehicles?: FleetVehicle[];
  initialDrumTransactions?: DrumTransaction[];
  dashboard: DashboardOverview;
  drumStats: DrumStats;
  rfm: RfmOverview;
  staffUsers?: RemixStaffUser[];
  sessionUser?: AuthUserProfile | null;
};

function productToFormData(product: Product): FormData {
  const fd = new FormData();
  fd.set("code", product.sku);
  fd.set("name", product.name);
  fd.set("viscosity", product.viscosity ?? "");
  fd.set("standard", product.standards ?? "");
  const liters =
    product.packageType === "Phuy 200L"
      ? 200
      : product.packageType === "Thùng 18L"
        ? 18
        : product.packageType === "Xô 4L"
          ? 4
          : 1;
  fd.set("volume", String(liters));
  fd.set("price", String(product.priceDealer ?? 0));
  fd.set("stock", String(product.stock ?? 0));
  if (product.drumReturnable) fd.set("isDrum", "on");
  return fd;
}

function customerToFormData(input: CustomerFormInput): FormData {
  const fd = new FormData();
  fd.set("name", input.name);
  fd.set("phone", input.phone);
  fd.set("address", input.address);
  fd.set("type", input.type);
  fd.set("creditLimit", String(input.creditLimit));
  if (input.creditTermDays) fd.set("creditTermDays", String(input.creditTermDays));
  if (input.lat) fd.set("lat", input.lat);
  if (input.lng) fd.set("lng", input.lng);
  if (input.visitDay) fd.set("visitDay", input.visitDay);
  return fd;
}

const moduleRoutes: Record<NavigationModule, string> = {
  dashboard: "/dashboard",
  products: "/san-pham",
  customers: "/khach-hang",
  sales_pwa: "/sales",
  fleet: "/fleet",
  loyalty_qr: "/tich-diem",
  drums: "/vo-phuy",
  kanban: "/don-hang",
  staff_rbac: "/nhan-su",
  settings: "/cau-hinh",
};

const routeModules: Record<string, NavigationModule> = {
  "/": "dashboard",
  "/dashboard": "dashboard",
  "/san-pham": "products",
  "/khach-hang": "customers",
  "/sales": "sales_pwa",
  "/fleet": "fleet",
  "/tich-diem": "loyalty_qr",
  "/vo-phuy": "drums",
  "/don-hang": "kanban",
  "/nhan-su": "staff_rbac",
  "/cau-hinh": "settings",
};

export default function RemixAppContainer({
  initialModule,
  initialProducts = [],
  initialCustomers = [],
  initialOrders = [],
  initialVehicles = [],
  initialDrumTransactions = [],
  dashboard,
  drumStats,
  rfm: _rfm,
  staffUsers = [],
  sessionUser = null,
}: RemixAppContainerProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [, startTransition] = useTransition();

  const getModuleFromPath = (path: string): NavigationModule => {
    if (initialModule) return initialModule;
    const cleanPath = path.replace(/\/$/, "") || "/";
    return routeModules[cleanPath] || "dashboard";
  };

  const [currentModule, setCurrentModule] = useState<NavigationModule>(() =>
    initialModule || getModuleFromPath(pathname || "/"),
  );
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const resolvedSessionUser: AuthUserProfile =
    sessionUser ?? DEMO_USERS[0]!;
  const [isGlobalOffline, setIsGlobalOffline] = useState(false);

  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers);
  const [vehicles, setVehicles] = useState<FleetVehicle[]>(initialVehicles);
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [offlineQueue, setOfflineQueue] = useState<Order[]>([]);
  const [drumTransactions, setDrumTransactions] = useState<DrumTransaction[]>(
    initialDrumTransactions,
  );
  const [prefilledCustomerId, setPrefilledCustomerId] = useState<
    string | undefined
  >(undefined);
  const [creditOverrideRequests, setCreditOverrideRequests] = useState<
    CreditOverrideRequest[]
  >([
    {
      id: "COR-101",
      customerId: "C02",
      customerName: "Đội Xe Logistics Demo",
      requestedBy: "Nguyễn Văn Hùng (Sales)",
      currentDebt: 94000000,
      creditLimit: 100000000,
      overdueDays: 122,
      reason:
        "Khách đang cần 2 phuy nhớt thay gấp cho 5 xe container chạy hàng Hải Phòng, cam kết thanh toán 50 triệu vào thứ Sáu.",
      requestedAmount: 31200000,
      requestedAt: "08:30 Hôm nay",
      status: "PENDING",
    },
  ]);

  useEffect(() => {
    setProducts(initialProducts);
    setCustomers(initialCustomers);
    setOrders(initialOrders);
    setVehicles(initialVehicles);
    setDrumTransactions(initialDrumTransactions);
  }, [
    initialProducts,
    initialCustomers,
    initialOrders,
    initialVehicles,
    initialDrumTransactions,
  ]);

  useEffect(() => {
    if (pathname && routeModules[pathname]) {
      setCurrentModule(routeModules[pathname]);
    }
  }, [pathname]);

  const moduleTitles: Record<NavigationModule, string> = {
    dashboard: "Tổng Quan & Phân Tích RFM",
    products: "Quản Lý Sản Phẩm (Master Data)",
    customers: "Khách Hàng & Hạn Mức Công Nợ",
    sales_pwa: "Tuyến Sales & Check-in GPS",
    fleet: "Quản Trị Đội Xe & Bảo Dưỡng",
    loyalty_qr: "Trạm Quét QR Tích Điểm Thợ Máy",
    drums: "Quản Lý Luân Chuyển Vỏ Phuy 200L",
    kanban: "Đơn Hàng & Kanban Kế Toán",
    staff_rbac: "Nhân Sự Sales & Phân Quyền RBAC",
    settings: "Cấu Hình & Tham Số Hệ Thống",
  };

  const handleSelectModule = (mod: NavigationModule) => {
    setCurrentModule(mod);
    if (mod !== "sales_pwa") setPrefilledCustomerId(undefined);
    const targetRoute = moduleRoutes[mod];
    if (
      targetRoute &&
      typeof window !== "undefined" &&
      window.location.pathname !== targetRoute
    ) {
      window.history.pushState(null, "", targetRoute);
    }
  };

  const handleNavigateToSales = (customerId?: string) => {
    if (customerId) setPrefilledCustomerId(customerId);
    handleSelectModule("sales_pwa");
  };

  const handleAddProduct = (newProduct: Product) => {
    setProducts((prev) => [newProduct, ...prev]);
    startTransition(async () => {
      const result = await createProduct(productToFormData(newProduct));
      if (!result.success) {
        toast.error(result.error ?? result.message);
        setProducts((prev) => prev.filter((p) => p.id !== newProduct.id));
        return;
      }
      toast.success(result.message);
      router.refresh();
    });
  };

  const handleDeleteProduct = (productId: string) => {
    const snapshot = products;
    setProducts((prev) => prev.filter((p) => p.id !== productId));
    startTransition(async () => {
      const result = await deleteProduct(productId);
      if (!result.success) {
        toast.error(result.error ?? result.message);
        setProducts(snapshot);
        return;
      }
      toast.success(result.message);
      router.refresh();
    });
  };

  const handleUpdateProduct = (updatedProduct: Product) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === updatedProduct.id ? updatedProduct : p)),
    );
    startTransition(async () => {
      const result = await updateProduct(
        updatedProduct.id,
        productToFormData(updatedProduct),
      );
      if (!result.success) {
        toast.error(result.error ?? result.message);
        router.refresh();
        return;
      }
      toast.success(result.message);
      router.refresh();
    });
  };

  const handleUpdateCreditLimit = (customerId: string, newLimit: number) => {
    const customer = customers.find((c) => c.id === customerId);
    if (!customer) return;
    setCustomers((prev) =>
      prev.map((c) =>
        c.id === customerId ? { ...c, creditLimit: newLimit } : c,
      ),
    );
    startTransition(async () => {
      const fd = customerToFormData({
        name: customer.name,
        phone: customer.phone ?? "",
        address: customer.address ?? "",
        type: customer.type === "Đội xe" ? "FLEET" : "GARAGE",
        creditLimit: newLimit,
        lat: customer.hasGps && customer.lat ? String(customer.lat) : "",
        lng: customer.hasGps && customer.lng ? String(customer.lng) : "",
        visitDay: customer.visitDay ?? "",
      });
      const result = await updateCustomer(customerId, fd);
      if (!result.success) {
        toast.error(result.error ?? result.message);
        router.refresh();
        return;
      }
      toast.success(result.message);
      router.refresh();
    });
  };

  const handleCreateCustomer = (input: CustomerFormInput) => {
    const tempId = `local-${Date.now()}`;
    setCustomers((prev) => [
      {
        id: tempId,
        name: input.name,
        phone: input.phone || undefined,
        address: input.address,
        type: input.type === "FLEET" ? "Đội xe" : "Đại lý",
        lat: Number(input.lat) || 0,
        lng: Number(input.lng) || 0,
        hasGps: Boolean(input.lat && input.lng),
        route: "",
        visitDay: input.visitDay || undefined,
        creditLimit: input.creditLimit,
        currentDebt: 0,
        emptyDrums: 0,
        lastPurchaseDaysAgo: 999,
      },
      ...prev,
    ]);
    startTransition(async () => {
      const result = await createCustomer(customerToFormData(input));
      if (!result.success) {
        toast.error(result.error ?? result.message);
        setCustomers((prev) => prev.filter((c) => c.id !== tempId));
        return;
      }
      toast.success(result.message);
      router.refresh();
    });
  };

  const handleUpdateCustomerProfile = (
    customerId: string,
    input: CustomerFormInput,
  ) => {
    setCustomers((prev) =>
      prev.map((c) =>
        c.id === customerId
          ? {
              ...c,
              name: input.name,
              phone: input.phone || undefined,
              address: input.address,
              type: input.type === "FLEET" ? "Đội xe" : "Đại lý",
              creditLimit: input.creditLimit,
              lat: Number(input.lat) || 0,
              lng: Number(input.lng) || 0,
              hasGps: Boolean(input.lat && input.lng),
              visitDay: input.visitDay || undefined,
            }
          : c,
      ),
    );
    startTransition(async () => {
      const result = await updateCustomer(
        customerId,
        customerToFormData(input),
      );
      if (!result.success) {
        toast.error(result.error ?? result.message);
        router.refresh();
        return;
      }
      toast.success(result.message);
      router.refresh();
    });
  };

  const handleDeleteCustomer = (customerId: string) => {
    const snapshot = customers;
    setCustomers((prev) => prev.filter((c) => c.id !== customerId));
    startTransition(async () => {
      const result = await deleteCustomer(customerId);
      if (!result.success) {
        toast.error(result.error ?? result.message);
        setCustomers(snapshot);
        return;
      }
      toast.success(result.message);
      router.refresh();
    });
  };

  const handlePayDebt = (customerId: string, amount: number) => {
    setCustomers((prev) =>
      prev.map((c) =>
        c.id === customerId
          ? { ...c, currentDebt: Math.max(0, c.currentDebt - amount) }
          : c,
      ),
    );
  };

  const handleSubmitOrder = (newOrder: Order, isOffline: boolean) => {
    if (isOffline) {
      setOfflineQueue((prev) => [newOrder, ...prev]);
      return;
    }

    setOrders((prev) => [newOrder, ...prev]);
    if (newOrder.customerId) {
      setCustomers((prev) =>
        prev.map((c) =>
          c.id === newOrder.customerId
            ? {
                ...c,
                currentDebt: c.currentDebt + newOrder.total,
                lastPurchaseDaysAgo: 0,
              }
            : c,
        ),
      );
    }
    if (newOrder.items) {
      setProducts((prev) =>
        prev.map((prod) => {
          const orderedItem = newOrder.items?.find(
            (i) => i.productId === prod.id,
          );
          if (orderedItem) {
            return {
              ...prod,
              stock: Math.max(0, prod.stock - orderedItem.quantity),
            };
          }
          return prod;
        }),
      );
    }

    startTransition(async () => {
      if (!newOrder.customerId || !newOrder.items?.length) {
        toast.error("Thiếu khách hàng hoặc dòng hàng.");
        return;
      }
      const result = await createOrder({
        customerId: newOrder.customerId,
        localId: newOrder.id.startsWith("local-") ? newOrder.id : null,
        discountPercent: newOrder.discountPercent,
        discountAmount: newOrder.discountAmount,
        promotionNotes: newOrder.promotionNotes,
        drumDelivered: newOrder.drumDelivered ?? newOrder.drumExchange?.delivered,
        drumReturned: newOrder.drumReturned ?? newOrder.drumExchange?.returned,
        drumDepositUnitPrice: 400000,
        isCreditOverride: newOrder.isCreditOverride,
        creditOverrideReason: newOrder.creditOverrideReason,
        signature: newOrder.signature,
        items: newOrder.items.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
        })),
      });
      if (!result.success) {
        toast.error(result.error ?? result.message);
        router.refresh();
        return;
      }
      toast.success(result.message);
      router.refresh();
    });
  };

  const handleSyncOfflineQueue = () => {
    if (offlineQueue.length === 0) return;
    const queue = [...offlineQueue];
    setOfflineQueue([]);
    startTransition(async () => {
      for (const order of queue) {
        if (!order.customerId || !order.items?.length) continue;
        const result = await createOrder({
          customerId: order.customerId,
          localId: order.id,
          discountPercent: order.discountPercent,
          discountAmount: order.discountAmount,
          promotionNotes: order.promotionNotes,
          drumDelivered: order.drumDelivered ?? order.drumExchange?.delivered,
          drumReturned: order.drumReturned ?? order.drumExchange?.returned,
          drumDepositUnitPrice: 400000,
          isCreditOverride: order.isCreditOverride,
          creditOverrideReason: order.creditOverrideReason,
          signature: order.signature,
          items: order.items.map((i) => ({
            productId: i.productId,
            quantity: i.quantity,
          })),
        });
        if (!result.success) {
          toast.error(result.error ?? result.message);
        }
      }
      toast.success("Đã đồng bộ hàng đợi offline.");
      router.refresh();
    });
  };

  const handleApproveOrderCreditOverride = (orderId: string) => {
    startTransition(async () => {
      const result = await approveCreditOverride(orderId);
      if (!result.success) {
        toast.error(result.error ?? result.message);
        return;
      }
      soundFX.playSuccess();
      toast.success(result.message);
      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId
            ? {
                ...o,
                status: "Xuất kho",
                creditOverrideStatus: "APPROVED",
                creditOverrideApprovedBy: resolvedSessionUser.name,
              }
            : o,
        ),
      );
      router.refresh();
    });
  };

  const handleRejectOrderCreditOverride = (orderId: string, reason?: string) => {
    startTransition(async () => {
      const result = await rejectCreditOverride(orderId, reason);
      if (!result.success) {
        toast.error(result.error ?? result.message);
        return;
      }
      toast.success(result.message);
      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId
            ? {
                ...o,
                creditOverrideStatus: "REJECTED",
              }
            : o,
        ),
      );
      router.refresh();
    });
  };

  const handleUpdateOrderStatus = (orderId: string, newStatus: OrderStatus) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o)),
    );
    startTransition(async () => {
      const result = await updateOrderStatus(
        orderId,
        mapRemixOrderStatusToPrisma(newStatus),
      );
      if (!result.success) {
        toast.error(result.error ?? result.message);
        router.refresh();
        return;
      }
      toast.success(result.message);
      router.refresh();
    });
  };

  const handleCancelOrder = (orderId: string) => {
    setOrders((prev) => prev.filter((o) => o.id !== orderId));
    startTransition(async () => {
      const result = await cancelOrder(orderId);
      if (!result.success) {
        toast.error(result.error ?? result.message);
        router.refresh();
        return;
      }
      toast.success(result.message);
      router.refresh();
    });
  };

  const handlePersistCheckIn = async (input: {
    customerId: string;
    lat: number;
    lng: number;
  }) => {
    const result = await createCheckIn(input);
    if (!result.success) {
      toast.error(result.error ?? result.message);
      return result;
    }
    if (
      result.pinnedGps &&
      result.customerLat != null &&
      result.customerLng != null
    ) {
      setCustomers((prev) =>
        prev.map((c) =>
          c.id === input.customerId
            ? {
                ...c,
                lat: result.customerLat!,
                lng: result.customerLng!,
                hasGps: true,
              }
            : c,
        ),
      );
    }
    toast.success(result.message);
    return result;
  };

  const handleUpdateVehicleKm = (
    vehicleId: string,
    currentKm: number,
    nextOilChangeKm: number,
  ) => {
    let status: "Xanh" | "Vàng" | "Đỏ" = "Xanh";
    if (currentKm > nextOilChangeKm) status = "Đỏ";
    else if (nextOilChangeKm - currentKm <= 500) status = "Vàng";

    setVehicles((prev) =>
      prev.map((v) =>
        v.id === vehicleId
          ? {
              ...v,
              currentKm,
              nextOilChangeKm,
              status,
              oilLifePercent: Math.max(
                0,
                Math.round(((nextOilChangeKm - currentKm) / 10000) * 100),
              ),
            }
          : v,
      ),
    );

    startTransition(async () => {
      const result = await updateMeter(vehicleId, currentKm);
      if (!result.success) {
        toast.error(result.error ?? result.message);
        router.refresh();
        return;
      }
      if (currentKm >= nextOilChangeKm) {
        await recordOilChange(vehicleId, currentKm);
      }
      router.refresh();
    });
  };

  const handleAddVehicle = (newVehicle: FleetVehicle) => {
    setVehicles((prev) => [...prev, newVehicle]);
    startTransition(async () => {
      const interval = Math.max(
        1,
        newVehicle.nextOilChangeKm - newVehicle.currentKm || 10000,
      );
      const result = await createVehicle({
        customerId: newVehicle.customerId,
        plateNumber: newVehicle.plate,
        label: newVehicle.vehicleType,
        unit: "KM",
        currentMeter: newVehicle.currentKm,
        lastServiceMeter: Math.max(
          0,
          newVehicle.nextOilChangeKm - interval,
        ),
        intervalValue: interval,
        notes: newVehicle.recommendedOil,
      });
      if (!result.success) {
        toast.error(result.error ?? result.message);
        router.refresh();
        return;
      }
      toast.success(result.message);
      router.refresh();
    });
  };

  const handleDeleteVehicle = (vehicleId: string) => {
    const snapshot = vehicles;
    setVehicles((prev) => prev.filter((v) => v.id !== vehicleId));
    startTransition(async () => {
      const result = await deleteVehicle(vehicleId);
      if (!result.success) {
        toast.error(result.error ?? result.message);
        setVehicles(snapshot);
        return;
      }
      toast.success(result.message);
      router.refresh();
    });
  };

  const handleAddLoyaltyPoints = (customerId: string, points: number) => {
    setCustomers((prev) =>
      prev.map((c) =>
        c.id === customerId
          ? { ...c, loyaltyPoints: Math.max(0, (c.loyaltyPoints ?? 0) + points) }
          : c,
      ),
    );
  };

  const handleScanLoyaltyCode = async (input: {
    code: string;
    mechanicName: string;
    mechanicPhone: string;
  }): Promise<{
    success: boolean;
    awarded?: number;
    points?: number;
    message: string;
  }> => {
    const mech = await findOrCreateMechanic({
      name: input.mechanicName,
      phone: input.mechanicPhone,
    });
    if (!mech.success || !mech.mechanicId) {
      const message = mech.error ?? mech.message;
      toast.error(message);
      return { success: false, message };
    }
    const result = await scanLoyaltyCode({
      code: input.code,
      mechanicId: mech.mechanicId,
    });
    if (!result.success) {
      const message = result.error ?? result.message;
      toast.error(message);
      return { success: false, message };
    }
    toast.success(result.message);
    if (typeof result.awarded === "number" && result.awarded > 0) {
      const match = customers.find(
        (c) =>
          c.phone === input.mechanicPhone ||
          c.name === input.mechanicName,
      );
      if (match) {
        handleAddLoyaltyPoints(match.id, result.awarded);
      }
    }
    router.refresh();
    return {
      success: true,
      awarded: result.awarded,
      points: result.points,
      message: result.message,
    };
  };
  const handleUpdateStaffRole = (userId: string, role: UserRole) => {
    startTransition(async () => {
      const result = await updateUserRole(userId, role);
      if (!result.success) {
        toast.error(result.error ?? result.message);
        router.refresh();
        return;
      }
      toast.success(result.message);
      router.refresh();
    });
  };

  const handleUpdateDrumBalance = (
    customerId: string,
    delivered: number,
    returned: number,
    signature?: string,
    signedBy?: string,
  ) => {
    const customer = customers.find((c) => c.id === customerId);
    if (!customer) return;

    const newBalance = Math.max(
      0,
      (customer.emptyDrums || 0) + delivered - returned,
    );

    setCustomers((prev) =>
      prev.map((c) =>
        c.id === customerId ? { ...c, emptyDrums: newBalance } : c,
      ),
    );

    setDrumTransactions((prev) => [
      {
        id: `DT-${Date.now().toString().slice(-4)}`,
        customerId,
        customerName: customer.name,
        delivered,
        returned,
        balanceAfter: newBalance,
        signature,
        signedBy,
        timestamp:
          new Date().toLocaleDateString("vi-VN") +
          " " +
          new Date().toLocaleTimeString("vi-VN", {
            hour: "2-digit",
            minute: "2-digit",
          }),
      },
      ...prev,
    ]);

    startTransition(async () => {
      if (delivered > 0) {
        const result = await issueDrums({
          customerId,
          quantity: delivered,
          notes: signedBy ? `e-PoD ký bởi: ${signedBy}` : undefined,
        });
        if (!result.success) {
          toast.error(result.error ?? result.message);
          router.refresh();
          return;
        }
      }
      if (returned > 0) {
        const result = await returnDrums({
          customerId,
          quantity: returned,
          notes: signedBy ? `e-PoD ký bởi: ${signedBy}` : undefined,
        });
        if (!result.success) {
          toast.error(result.error ?? result.message);
          router.refresh();
          return;
        }
      }
      if (delivered === 0 && returned === 0) {
        const result = await adjustDrums({
          customerId,
          targetOutstanding: newBalance,
          notes: "Điều chỉnh từ UI Remix",
        });
        if (!result.success) {
          toast.error(result.error ?? result.message);
          router.refresh();
          return;
        }
      }
      toast.success("Đã cập nhật sổ phuy.");
      router.refresh();
    });
  };

  const handleSignDrumTransaction = (
    transactionId: string,
    signature: string,
    signedBy: string,
  ) => {
    setDrumTransactions((prev) =>
      prev.map((t) =>
        t.id === transactionId ? { ...t, signature, signedBy } : t,
      ),
    );
  };

  const handleRequestCreditOverride = (
    customerId: string,
    reason: string,
    requestedAmount: number,
  ) => {
    const cust = customers.find((c) => c.id === customerId);
    if (!cust) return;

    const newReq: CreditOverrideRequest = {
      id: `COR-${Date.now().toString().slice(-4)}`,
      customerId,
      customerName: cust.name,
      requestedBy: resolvedSessionUser.name,
      currentDebt: cust.currentDebt,
      creditLimit: cust.creditLimit,
      overdueDays: cust.debtAging?.maxOverdueDays || 122,
      reason,
      requestedAmount,
      requestedAt: new Date().toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      status: "PENDING",
    };

    setCreditOverrideRequests((prev) => [
      newReq,
      ...prev.filter((r) => r.customerId !== customerId),
    ]);
    setCustomers((prev) =>
      prev.map((c) =>
        c.id === customerId
          ? {
              ...c,
              creditOverrideReason: reason,
              creditOverrideRequestedAt: new Date().toLocaleTimeString(
                "vi-VN",
                { hour: "2-digit", minute: "2-digit" },
              ),
            }
          : c,
      ),
    );
    toast.success(
      "Đã gửi yêu cầu phê duyệt vượt trần tới Ban Giám Đốc (ADMIN)!",
    );
  };

  const handleApproveCreditOverride = (customerId: string) => {
    setCreditOverrideRequests((prev) =>
      prev.map((r) =>
        r.customerId === customerId
          ? { ...r, status: "APPROVED", reviewedBy: resolvedSessionUser.name }
          : r,
      ),
    );
    setCustomers((prev) =>
      prev.map((c) =>
        c.id === customerId
          ? {
              ...c,
              creditOverridden: true,
              creditOverrideApprovedBy: resolvedSessionUser.name,
            }
          : c,
      ),
    );
    soundFX.playSuccess();
    toast.success(
      "Ban Giám Đốc đã phê duyệt vượt trần công nợ. Khách hàng đã mở khóa lên đơn!",
    );
  };

  const handleRejectCreditOverride = (
    customerId: string,
    rejectReason?: string,
  ) => {
    setCreditOverrideRequests((prev) =>
      prev.map((r) =>
        r.customerId === customerId
          ? { ...r, status: "REJECTED", rejectReason }
          : r,
      ),
    );
    setCustomers((prev) =>
      prev.map((c) =>
        c.id === customerId
          ? { ...c, creditOverridden: false, creditOverrideReason: undefined }
          : c,
      ),
    );
    toast.error(
      "Đã từ chối cấp nợ vượt trần. Yêu cầu Sales thu hồi nợ cũ trước!",
    );
  };

  const handleCreateEmergencyFleetOrder = (vehicle: FleetVehicle) => {
    const cust = customers.find((c) => c.id === vehicle.customerId);
    const matchedProduct =
      products.find(
        (p) => p.packageType === "Phuy 200L" || p.sku.includes("15W40"),
      ) || products[0];

    const remainingKm = vehicle.currentKm - vehicle.nextOilChangeKm;
    const emergencyOrder: Order = {
      id: `DH-EMG-${Date.now().toString().slice(-4)}`,
      customerId: vehicle.customerId,
      customer: cust?.name || vehicle.customerName || "Đội xe",
      createdAt: new Date().toISOString(),
      status: "Chờ duyệt",
      discountPercent: 0,
      discountAmount: 0,
      totalLiters: 200,
      items: matchedProduct
        ? [
            {
              productId: matchedProduct.id,
              productName: matchedProduct.name,
              sku: matchedProduct.sku,
              quantity: 1,
              unitPrice:
                matchedProduct.priceFleet ||
                matchedProduct.priceDealer ||
                15600000,
              total:
                matchedProduct.priceFleet ||
                matchedProduct.priceDealer ||
                15600000,
            },
          ]
        : [],
      total:
        matchedProduct?.priceFleet ||
        matchedProduct?.priceDealer ||
        15600000,
      drumExchange: {
        delivered: 1,
        returned: 1,
      },
      promotionNotes: `🚨 [ĐƠN GẤP ODOMETER] Xe ${vehicle.plate} (${vehicle.vehicleType}) quá hạn thay nhớt ${Math.abs(remainingKm)} KM. Tự động phát sinh từ Odometer 0%.`,
    };

    handleSubmitOrder(emergencyOrder, false);
    soundFX.playSuccess();
    toast.success(
      `🚨 Đã tự động tạo Đơn Hàng Khẩn Cấp #${emergencyOrder.id} cho xe ${vehicle.plate} và chuyển vào cột Chờ Duyệt!`,
    );
    handleSelectModule("kanban");
  };

  const pendingOrdersCount = orders.filter(
    (o) => o.status === "Chờ duyệt",
  ).length;
  const urgentFleetCount = vehicles.filter(
    (v) => v.currentKm > v.nextOilChangeKm,
  ).length;
  const rfmAlertCount = customers.filter(
    (c) => c.lastPurchaseDaysAgo !== undefined && c.lastPurchaseDaysAgo >= 30,
  ).length;

  return (
    <div
      id="app-root"
      className="flex min-h-screen bg-slate-50 font-sans text-slate-900 antialiased"
    >
      <Sidebar
        currentModule={currentModule}
        onSelectModule={handleSelectModule}
        pendingOrdersCount={pendingOrdersCount}
        urgentFleetCount={urgentFleetCount}
        rfmAlertCount={rfmAlertCount}
        isOpenMobile={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />

      <div className="flex flex-1 flex-col overflow-hidden">
        <Header
          currentModuleName={moduleTitles[currentModule]}
          sessionUser={resolvedSessionUser}
          isOffline={isGlobalOffline}
          onToggleOffline={() => setIsGlobalOffline(!isGlobalOffline)}
          offlineCount={offlineQueue.length}
          onSyncOffline={handleSyncOfflineQueue}
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
        />

        <main className="flex-1 overflow-y-auto p-3 sm:p-6 lg:p-8 pb-24 lg:pb-8">
          <div className="mx-auto max-w-7xl">
            {currentModule === "dashboard" && (
              <DashboardView
                overview={dashboard}
                drumStats={drumStats}
                customers={customers}
                orders={orders}
                vehicles={vehicles}
                products={products}
                onNavigate={(mod) => {
                  if (mod === "sales-pwa" || mod === "sales_pwa")
                    handleNavigateToSales();
                  else if (mod === "kanban") handleSelectModule("kanban");
                  else if (mod === "customers") handleSelectModule("customers");
                  else if (mod === "fleet") handleSelectModule("fleet");
                  else if (mod === "drums") handleSelectModule("drums");
                  else if (mod in moduleTitles)
                    handleSelectModule(mod as NavigationModule);
                }}
              />
            )}

            {currentModule === "products" && (
              <ProductsView
                products={products}
                onAddProduct={handleAddProduct}
                onDeleteProduct={handleDeleteProduct}
                onUpdateProduct={handleUpdateProduct}
              />
            )}

            {currentModule === "customers" && (
              <CustomersView
                customers={customers}
                onUpdateCreditLimit={handleUpdateCreditLimit}
                onNavigateToSales={handleNavigateToSales}
                onCreateCustomer={handleCreateCustomer}
                onUpdateCustomer={handleUpdateCustomerProfile}
                onDeleteCustomer={handleDeleteCustomer}
                onPayDebt={handlePayDebt}
                sessionUser={resolvedSessionUser}
                creditOverrideRequests={creditOverrideRequests}
                onRequestCreditOverride={handleRequestCreditOverride}
                onApproveCreditOverride={handleApproveCreditOverride}
                onRejectCreditOverride={handleRejectCreditOverride}
              />
            )}

            {currentModule === "kanban" && (
              <KanbanView
                orders={orders}
                onUpdateOrderStatus={handleUpdateOrderStatus}
                onCancelOrder={handleCancelOrder}
                onApproveCreditOverride={handleApproveOrderCreditOverride}
                onRejectCreditOverride={handleRejectOrderCreditOverride}
              />
            )}

            {currentModule === "fleet" && (
              <FleetView
                vehicles={vehicles}
                customers={customers}
                onNavigateToSales={handleNavigateToSales}
                onUpdateVehicleKm={handleUpdateVehicleKm}
                onAddVehicle={handleAddVehicle}
                onDeleteVehicle={handleDeleteVehicle}
                onAutoCreateEmergencyOrder={handleCreateEmergencyFleetOrder}
              />
            )}

            {currentModule === "sales_pwa" && (
              <SalesPWAView
                customers={customers}
                products={products}
                selectedCustomerId={prefilledCustomerId}
                isGlobalOffline={isGlobalOffline}
                onToggleGlobalOffline={() =>
                  setIsGlobalOffline(!isGlobalOffline)
                }
                onSubmitOrder={handleSubmitOrder}
                offlineQueue={offlineQueue}
                onSyncOfflineQueue={handleSyncOfflineQueue}
                onPayDebt={handlePayDebt}
                onOpenAdminDashboard={() => handleSelectModule("dashboard")}
                onPersistCheckIn={handlePersistCheckIn}
              />
            )}

            {currentModule === "loyalty_qr" && (
              <LoyaltyQRView
                customers={customers}
                onAddLoyaltyPoints={handleAddLoyaltyPoints}
                onScanLoyaltyCode={handleScanLoyaltyCode}
              />
            )}

            {currentModule === "drums" && (
              <DrumsView
                customers={customers}
                drumTransactions={drumTransactions}
                onUpdateDrumBalance={handleUpdateDrumBalance}
                onSignTransaction={handleSignDrumTransaction}
              />
            )}

            {currentModule === "staff_rbac" && (
              <StaffRBACView
                staffUsers={staffUsers}
                onUpdateRole={handleUpdateStaffRole}
              />
            )}
            {currentModule === "settings" && <SettingsView />}
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar (Thumb-friendly 1-tap navigation for mobile field staff) */}
      <nav
        id="mobile-bottom-nav"
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 py-1.5 px-3 flex items-center justify-around shadow-xl select-none"
      >
        <button
          type="button"
          onClick={() => {
            soundFX.playClick();
            handleSelectModule("dashboard");
          }}
          className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-xl transition-all cursor-pointer ${
            currentModule === "dashboard"
              ? "text-amber-600 font-bold"
              : "text-slate-500 hover:text-slate-900"
          }`}
        >
          <LayoutDashboard className="size-5" />
          <span className="text-[10px] leading-tight">Tổng quan</span>
        </button>

        <button
          type="button"
          onClick={() => {
            soundFX.playClick();
            handleSelectModule("customers");
          }}
          className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-xl transition-all cursor-pointer ${
            currentModule === "customers"
              ? "text-amber-600 font-bold"
              : "text-slate-500 hover:text-slate-900"
          }`}
        >
          <Users className="size-5" />
          <span className="text-[10px] leading-tight">Khách hàng</span>
        </button>

        {/* Central Prominent Sales CTA Button */}
        <button
          type="button"
          onClick={() => {
            soundFX.playClick();
            handleSelectModule("sales_pwa");
          }}
          className="flex flex-col items-center -mt-5 cursor-pointer"
          title="Lên đơn bán hàng thực địa"
        >
          <div className="size-12 rounded-full bg-amber-500 hover:bg-amber-400 text-slate-950 flex items-center justify-center shadow-lg ring-4 ring-white active:scale-95 transition-all">
            <ShoppingCart className="size-5" />
          </div>
          <span className="text-[10px] font-bold text-slate-800 mt-0.5">Lên đơn</span>
        </button>

        <button
          type="button"
          onClick={() => {
            soundFX.playClick();
            handleSelectModule("kanban");
          }}
          className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-xl relative transition-all cursor-pointer ${
            currentModule === "kanban"
              ? "text-amber-600 font-bold"
              : "text-slate-500 hover:text-slate-900"
          }`}
        >
          <Layers className="size-5" />
          <span className="text-[10px] leading-tight">Đơn hàng</span>
          {pendingOrdersCount > 0 && (
            <span className="absolute top-0 right-1 size-2 rounded-full bg-rose-500 ring-2 ring-white" />
          )}
        </button>

        <button
          type="button"
          onClick={() => {
            soundFX.playClick();
            setIsMobileMenuOpen(true);
          }}
          className="flex flex-col items-center gap-0.5 py-1 px-2 rounded-xl text-slate-500 hover:text-slate-900 transition-all cursor-pointer"
        >
          <Menu className="size-5" />
          <span className="text-[10px] leading-tight">Thêm</span>
        </button>
      </nav>
    </div>
  );
}
