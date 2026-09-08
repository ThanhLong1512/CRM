'use client';

import { useState } from 'react';
import {
  Product,
  Customer,
  FleetVehicle,
  Order,
  OrderStatus,
  DrumTransaction,
  NavigationModule,
  AuthUser,
} from './types';
import {
  INITIAL_PRODUCTS,
  INITIAL_CUSTOMERS,
  INITIAL_FLEET_VEHICLES,
  INITIAL_ORDERS,
  INITIAL_DRUM_TRANSACTIONS,
} from './mockData';

import Sidebar from './components/Sidebar';
import Header from './components/Header';
import DashboardView from './components/DashboardView';
import ProductsView from './components/ProductsView';
import CustomersView from './components/CustomersView';
import SalesPWAView from './components/SalesPWAView';
import FleetView from './components/FleetView';
import LoyaltyQRView from './components/LoyaltyQRView';
import DrumsView from './components/DrumsView';
import KanbanView from './components/KanbanView';
import StaffRBACView from './components/StaffRBACView';
import SettingsView from './components/SettingsView';

import AuthScreen from './components/auth/AuthScreen';
import UserProfileModal from './components/auth/UserProfileModal';
import LogoutConfirmDialog from './components/auth/LogoutConfirmDialog';
import ChangePasswordModal from './components/auth/ChangePasswordModal';
import { getSavedAuthUser, saveAuthUser } from './components/auth/authData';
import { soundFX } from './utils/audio';

export default function App() {
  // Authentication & Session State
  const [authUser, setAuthUser] = useState<AuthUser | null>(getSavedAuthUser());
  const [isProfileModalOpen, setIsProfileModalOpen] = useState<boolean>(false);
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState<boolean>(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Navigation state - defaults to full system CRM Dashboard
  const [currentModule, setCurrentModule] = useState<NavigationModule>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<string>('Sales: Nguyễn Văn A');
  const [isGlobalOffline, setIsGlobalOffline] = useState<boolean>(false);

  // Global Mock Datasets
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [customers, setCustomers] = useState<Customer[]>(INITIAL_CUSTOMERS);
  const [vehicles, setVehicles] = useState<FleetVehicle[]>(INITIAL_FLEET_VEHICLES);
  const [orders, setOrders] = useState<Order[]>(INITIAL_ORDERS);
  const [offlineQueue, setOfflineQueue] = useState<Order[]>([]);
  const [drumTransactions, setDrumTransactions] = useState<DrumTransaction[]>(
    INITIAL_DRUM_TRANSACTIONS
  );

  // Interlinking state: pre-fill customer in Sales PWA
  const [prefilledCustomerId, setPrefilledCustomerId] = useState<string | undefined>(undefined);

  // Navigation module names for Header
  const moduleTitles: Record<NavigationModule, string> = {
    dashboard: 'Tổng Quan & Phân Tích RFM',
    products: 'Quản Lý Sản Phẩm (Master Data)',
    customers: 'Khách Hàng & Hạn Mức Công Nợ',
    sales_pwa: 'Tuyến Sales & Check-in GPS',
    fleet: 'Quản Trị Đội Xe & Bảo Dưỡng',
    loyalty_qr: 'Trạm Quét QR Tích Điểm Thợ Máy',
    drums: 'Quản Lý Luân Chuyển Vỏ Phuy 200L',
    kanban: 'Đơn Hàng & Kanban Kế Toán',
    staff_rbac: 'Nhân Sự Sales & Phân Quyền RBAC',
    settings: 'Cấu Hình & Tham Số Hệ Thống',
  };

  // Handler: Navigate to Sales PWA with pre-selected customer
  const handleNavigateToSales = (customerId?: string) => {
    if (customerId) {
      setPrefilledCustomerId(customerId);
    }
    setCurrentModule('sales_pwa');
  };

  // Handler: Add new product
  const handleAddProduct = (newProduct: Product) => {
    setProducts((prev) => [newProduct, ...prev]);
  };

  // Handler: Delete product
  const handleDeleteProduct = (productId: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== productId));
  };

  // Handler: Update product
  const handleUpdateProduct = (updatedProduct: Product) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === updatedProduct.id ? updatedProduct : p))
    );
  };

  // Handler: Update Customer Credit Limit
  const handleUpdateCreditLimit = (customerId: string, newLimit: number) => {
    setCustomers((prev) =>
      prev.map((c) => (c.id === customerId ? { ...c, creditLimit: newLimit } : c))
    );
  };

  // Handler: Collect Debt cash immediately
  const handlePayDebt = (customerId: string, amount: number) => {
    setCustomers((prev) =>
      prev.map((c) =>
        c.id === customerId
          ? { ...c, currentDebt: Math.max(0, c.currentDebt - amount) }
          : c
      )
    );
  };

  // Handler: Submit order from PWA
  const handleSubmitOrder = (newOrder: Order, isOffline: boolean) => {
    if (isOffline) {
      // Add to offline queue
      setOfflineQueue((prev) => [newOrder, ...prev]);
    } else {
      // Add directly to active orders
      setOrders((prev) => [newOrder, ...prev]);

      // Update customer's debt & reset last purchase days
      if (newOrder.customerId) {
        setCustomers((prev) =>
          prev.map((c) =>
            c.id === newOrder.customerId
              ? { ...c, currentDebt: c.currentDebt + newOrder.total, lastPurchaseDaysAgo: 0 }
              : c
          )
        );
      }

      // Deduct inventory stock
      if (newOrder.items) {
        setProducts((prev) =>
          prev.map((prod) => {
            const orderedItem = newOrder.items?.find((i) => i.productId === prod.id);
            if (orderedItem) {
              return { ...prod, stock: Math.max(0, prod.stock - orderedItem.quantity) };
            }
            return prod;
          })
        );
      }
    }
  };

  // Handler: Sync offline queue when back online
  const handleSyncOfflineQueue = () => {
    if (offlineQueue.length === 0) return;

    // Move all offline orders to active orders
    setOrders((prev) => [...offlineQueue, ...prev]);

    // Update debt & stock for each synced order
    offlineQueue.forEach((order) => {
      if (order.customerId) {
        setCustomers((prev) =>
          prev.map((c) =>
            c.id === order.customerId
              ? { ...c, currentDebt: c.currentDebt + order.total, lastPurchaseDaysAgo: 0 }
              : c
          )
        );
      }

      if (order.items) {
        setProducts((prev) =>
          prev.map((prod) => {
            const orderedItem = order.items?.find((i) => i.productId === prod.id);
            if (orderedItem) {
              return { ...prod, stock: Math.max(0, prod.stock - orderedItem.quantity) };
            }
            return prod;
          })
        );
      }
    });

    setOfflineQueue([]);
  };

  // Handler: Kanban order stage update
  const handleUpdateOrderStatus = (orderId: string, newStatus: OrderStatus) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
    );
  };

  // Handler: Update Fleet vehicle km
  const handleUpdateVehicleKm = (
    vehicleId: string,
    currentKm: number,
    nextOilChangeKm: number
  ) => {
    let status: 'Xanh' | 'Vàng' | 'Đỏ' = 'Xanh';
    if (currentKm > nextOilChangeKm) {
      status = 'Đỏ';
    } else if (nextOilChangeKm - currentKm <= 500) {
      status = 'Vàng';
    }

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
                Math.round(((nextOilChangeKm - currentKm) / 10000) * 100)
              ),
            }
          : v
      )
    );
  };

  // Handler: Add vehicle
  const handleAddVehicle = (newVehicle: FleetVehicle) => {
    setVehicles((prev) => [...prev, newVehicle]);
  };

  // Handler: Add Loyalty Points for Mechanic
  const handleAddLoyaltyPoints = (customerId: string, points: number) => {
    setCustomers((prev) =>
      prev.map((c) =>
        c.id === customerId
          ? { ...c, loyaltyPoints: Math.max(0, (c.loyaltyPoints ?? 0) + points) }
          : c
      )
    );
  };

  // Handler: Update Drum Balance
  const handleUpdateDrumBalance = (
    customerId: string,
    delivered: number,
    returned: number
  ) => {
    const customer = customers.find((c) => c.id === customerId);
    if (!customer) return;

    const newBalance = Math.max(0, (customer.emptyDrums || 0) + delivered - returned);

    setCustomers((prev) =>
      prev.map((c) => (c.id === customerId ? { ...c, emptyDrums: newBalance } : c))
    );

    const newLog: DrumTransaction = {
      id: `DT-${Date.now().toString().slice(-4)}`,
      customerId,
      customerName: customer.name,
      delivered,
      returned,
      balanceAfter: newBalance,
      timestamp:
        new Date().toLocaleDateString('vi-VN') +
        ' ' +
        new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    };

    setDrumTransactions((prev) => [newLog, ...prev]);
  };

  // Badge counters
  const pendingOrdersCount = orders.filter((o) => o.status === 'Chờ duyệt').length;
  const urgentFleetCount = vehicles.filter((v) => v.currentKm > v.nextOilChangeKm).length;
  const rfmAlertCount = customers.filter(
    (c) => c.lastPurchaseDaysAgo !== undefined && c.lastPurchaseDaysAgo >= 30
  ).length;

  // Authentication Handlers
  const handleLoginSuccess = (user: AuthUser) => {
    setAuthUser(user);
    saveAuthUser(user);
    setCurrentUser(user.name);
    setToastMessage(`Đăng nhập thành công! Xin chào ${user.name}`);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleLogout = () => {
    setIsLogoutConfirmOpen(false);
    setIsProfileModalOpen(false);
    setAuthUser(null);
    saveAuthUser(null);
    soundFX.playClick();
  };

  const handleSwitchUser = (newUser: AuthUser) => {
    setAuthUser(newUser);
    saveAuthUser(newUser);
    setCurrentUser(newUser.name);
    setToastMessage(`Đã chuyển sang vai trò: ${newUser.roleTitle}`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // If not authenticated, present the professional Auth Screen
  if (!authUser) {
    return <AuthScreen onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div id="app-root" className="min-h-screen flex bg-slate-50 text-slate-900 font-sans antialiased">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 bg-slate-900 text-amber-400 border border-amber-500/40 px-4 py-2.5 rounded-2xl shadow-xl text-xs font-bold flex items-center gap-2 animate-in fade-in slide-in-from-top-3 duration-200">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. Left Sidebar: Fixed Desktop on lg (>= 1024px) & Sliding Drawer on mobile/tablet */}
      <Sidebar
        currentModule={currentModule}
        onSelectModule={(mod) => {
          setCurrentModule(mod);
          // If leaving sales pwa, clear specific prefill
          if (mod !== 'sales_pwa') {
            setPrefilledCustomerId(undefined);
          }
        }}
        pendingOrdersCount={pendingOrdersCount}
        urgentFleetCount={urgentFleetCount}
        rfmAlertCount={rfmAlertCount}
        isOpenMobile={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
        authUser={authUser}
        onOpenProfile={() => setIsProfileModalOpen(true)}
        onRequestLogout={() => setIsLogoutConfirmOpen(true)}
      />

      {/* 2. Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Top Header with Hamburger Button on < 1024px */}
        <Header
          currentModuleName={moduleTitles[currentModule]}
          currentUser={currentUser}
          authUser={authUser}
          onUserChange={setCurrentUser}
          onOpenProfile={() => setIsProfileModalOpen(true)}
          onRequestLogout={() => setIsLogoutConfirmOpen(true)}
          isOffline={isGlobalOffline}
          onToggleOffline={() => setIsGlobalOffline(!isGlobalOffline)}
          offlineCount={offlineQueue.length}
          onSyncOffline={handleSyncOfflineQueue}
          onNavigateToSales={handleNavigateToSales}
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
        />

        {/* Main Content Viewport: Full width fluid layout */}
        <main className="flex-1 p-3 sm:p-5 md:p-6 overflow-y-auto w-full">
          <div className="w-full">
            {currentModule === 'dashboard' && (
              <DashboardView
                orders={orders}
                customers={customers}
                products={products}
                vehicles={vehicles}
                onNavigate={(mod) => {
                  if (mod === 'sales-pwa') handleNavigateToSales();
                  else if (mod === 'kanban') setCurrentModule('kanban');
                  else if (mod === 'customers') setCurrentModule('customers');
                  else if (mod === 'fleet') setCurrentModule('fleet');
                  else if (mod in moduleTitles) setCurrentModule(mod as NavigationModule);
                }}
              />
            )}

            {currentModule === 'products' && (
              <ProductsView
                products={products}
                onAddProduct={handleAddProduct}
                onDeleteProduct={handleDeleteProduct}
                onUpdateProduct={handleUpdateProduct}
              />
            )}

            {currentModule === 'customers' && (
              <CustomersView
                customers={customers}
                onUpdateCreditLimit={handleUpdateCreditLimit}
                onNavigateToSales={handleNavigateToSales}
              />
            )}

            {currentModule === 'kanban' && (
              <KanbanView
                orders={orders}
                onUpdateOrderStatus={handleUpdateOrderStatus}
              />
            )}

            {currentModule === 'fleet' && (
              <FleetView
                vehicles={vehicles}
                customers={customers}
                onNavigateToSales={handleNavigateToSales}
                onUpdateVehicleKm={handleUpdateVehicleKm}
                onAddVehicle={handleAddVehicle}
              />
            )}

            {currentModule === 'sales_pwa' && (
              <SalesPWAView
                customers={customers}
                products={products}
                selectedCustomerId={prefilledCustomerId}
                isGlobalOffline={isGlobalOffline}
                onToggleGlobalOffline={() => setIsGlobalOffline(!isGlobalOffline)}
                onSubmitOrder={handleSubmitOrder}
                offlineQueue={offlineQueue}
                onSyncOfflineQueue={handleSyncOfflineQueue}
                onPayDebt={handlePayDebt}
                onOpenAdminDashboard={() => setCurrentModule('dashboard')}
              />
            )}

            {currentModule === 'loyalty_qr' && (
              <LoyaltyQRView
                customers={customers}
                onAddLoyaltyPoints={handleAddLoyaltyPoints}
              />
            )}

            {currentModule === 'drums' && (
              <DrumsView
                customers={customers}
                drumTransactions={drumTransactions}
                onUpdateDrumBalance={handleUpdateDrumBalance}
              />
            )}

            {currentModule === 'staff_rbac' && <StaffRBACView />}

            {currentModule === 'settings' && <SettingsView />}
          </div>
        </main>
      </div>

      {/* User Profile & RBAC Inspector Modal */}
      <UserProfileModal
        isOpen={isProfileModalOpen}
        currentUser={authUser}
        onClose={() => setIsProfileModalOpen(false)}
        onSwitchUser={handleSwitchUser}
        onOpenChangePassword={() => {
          setIsProfileModalOpen(false);
          setIsChangePasswordOpen(true);
        }}
        onRequestLogout={() => {
          setIsProfileModalOpen(false);
          setIsLogoutConfirmOpen(true);
        }}
      />

      {/* Logout Confirmation Dialog */}
      <LogoutConfirmDialog
        isOpen={isLogoutConfirmOpen}
        currentUser={authUser}
        pendingOfflineCount={offlineQueue.length}
        onClose={() => setIsLogoutConfirmOpen(false)}
        onConfirmLogout={handleLogout}
      />

      {/* In-app Change Password Modal */}
      <ChangePasswordModal
        isOpen={isChangePasswordOpen}
        userEmail={authUser.email}
        onClose={() => setIsChangePasswordOpen(false)}
        onSuccess={() => {
          setIsChangePasswordOpen(false);
          setToastMessage('Đổi mật khẩu thành công!');
          setTimeout(() => setToastMessage(null), 3000);
        }}
      />
    </div>
  );
}
