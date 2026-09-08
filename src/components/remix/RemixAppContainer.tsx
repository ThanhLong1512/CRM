"use client";

import { useState, useEffect, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Product,
  Customer,
  FleetVehicle,
  Order,
  OrderStatus,
  DrumTransaction,
  NavigationModule,
} from "@/types";
import type { DashboardOverview } from "@/lib/data/dashboard";
import type { DrumStats } from "@/lib/data/drums";
import type { RfmOverview } from "@/lib/data/rfm";
import { mapRemixOrderStatusToPrisma } from "@/lib/remix/mappers";
import type { RemixStaffUser } from "@/lib/remix/load-bootstrap";
import { createOrder, updateOrderStatus, cancelOrder } from "@/app/(private)/don-hang/actions";
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
  if (input.lat) fd.set("lat", input.lat);
  if (input.lng) fd.set("lng", input.lng);
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

  const handlePersistCheckIn = (input: {
    customerId: string;
    lat: number;
    lng: number;
  }) => {
    startTransition(async () => {
      const result = await createCheckIn(input);
      if (!result.success) {
        toast.error(result.error ?? result.message);
        return;
      }
      toast.success(result.message);
    });
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
        const result = await issueDrums({ customerId, quantity: delivered });
        if (!result.success) {
          toast.error(result.error ?? result.message);
          router.refresh();
          return;
        }
      }
      if (returned > 0) {
        const result = await returnDrums({ customerId, quantity: returned });
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

      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <Header
          currentModuleName={moduleTitles[currentModule]}
          sessionUser={resolvedSessionUser}
          isOffline={isGlobalOffline}
          onToggleOffline={() => setIsGlobalOffline(!isGlobalOffline)}
          offlineCount={offlineQueue.length}
          onSyncOffline={handleSyncOfflineQueue}
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
        />

        <main className="w-full flex-1 overflow-y-auto p-3 sm:p-5 md:p-6">
          <div className="w-full">
            {currentModule === "dashboard" && (
              <DashboardView
                orders={orders}
                customers={customers}
                products={products}
                vehicles={vehicles}
                overview={dashboard}
                drumStats={drumStats}
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
              />
            )}

            {currentModule === "kanban" && (
              <KanbanView
                orders={orders}
                onUpdateOrderStatus={handleUpdateOrderStatus}
                onCancelOrder={handleCancelOrder}
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
    </div>
  );
}
