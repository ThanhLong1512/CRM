"use client";
import { useState, useEffect, useMemo } from 'react';
import { Customer, Product, Order } from '../types';
import { soundFX } from '../utils/audio';
import {
  seedOfflineDatabase,
  enqueueOfflineOrder,
  recordOfflineCollection,
} from '../db/offlineDb';

import dynamic from 'next/dynamic';
const PwaRouteMap = dynamic(() => import('./pwa/PwaRouteMap'), {
  ssr: false,
  loading: () => (
    <div className="h-96 w-full flex items-center justify-center bg-slate-100 rounded-xl text-slate-500 font-mono text-xs">
      Đang tải bản đồ số GPS...
    </div>
  ),
});
import PwaFastCatalog from './pwa/PwaFastCatalog';
import PwaOrderReviewDrawer from './pwa/PwaOrderReviewDrawer';
import {
  MapPin,
  ShoppingCart,
  Wifi,
  CloudOff,
  RefreshCw,
  CheckCircle2,
  Printer,
  MessageCircle,
  Flame,
} from 'lucide-react';
import OrderPrintReceipt from './OrderPrintReceipt';
import ZaloShareModal from './ZaloShareModal';

export type PwaTab = 'route' | 'catalog';

interface SalesPWAViewProps {
  customers: Customer[];
  products: Product[];
  selectedCustomerId?: string;
  isGlobalOffline: boolean;
  onToggleGlobalOffline: () => void;
  onSubmitOrder: (order: Order, isOffline: boolean) => void;
  offlineQueue: Order[];
  onSyncOfflineQueue: () => void;
  onPayDebt?: (customerId: string, amount: number) => void;
  onOpenAdminDashboard?: () => void;
  onPersistCheckIn?: (input: {
    customerId: string;
    lat: number;
    lng: number;
  }) => void;
}

export default function SalesPWAView({
  customers,
  products,
  selectedCustomerId,
  isGlobalOffline,
  onToggleGlobalOffline,
  onSubmitOrder,
  offlineQueue,
  onSyncOfflineQueue,
  onPayDebt,
  onOpenAdminDashboard,
  onPersistCheckIn,
}: SalesPWAViewProps) {
  // Navigation tabs: 'route' | 'catalog'
  const [activeTab, setActiveTab] = useState<PwaTab>('route');

  // Customer selection & Check-in tracking
  const [activeCustomerId, setActiveCustomerId] = useState<string>(
    selectedCustomerId || customers[0]?.id || 'C01'
  );
  const [checkedInCustomerIds, setCheckedInCustomerIds] = useState<Set<string>>(
    new Set(['C01']) // Initial check-in for easy exploration
  );

  // Cart state: Record<productId, quantity>
  const [cart, setCart] = useState<Record<string, number>>({});
  const [isReviewDrawerOpen, setIsReviewDrawerOpen] = useState<boolean>(false);
  const [receiptOrder, setReceiptOrder] = useState<Order | null>(null);
  const [lastSubmittedOrder, setLastSubmittedOrder] = useState<Order | null>(null);
  const [showZaloModal, setShowZaloModal] = useState<boolean>(false);

  // Syncing state
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Active customer object
  const activeCustomer = useMemo(() => {
    return customers.find((c) => c.id === activeCustomerId) || customers[0];
  }, [customers, activeCustomerId]);

  // Update active customer if prop changes
  useEffect(() => {
    if (selectedCustomerId) {
      setActiveCustomerId(selectedCustomerId);
    }
  }, [selectedCustomerId]);

  // Initialize Dexie offline DB on mount
  useEffect(() => {
    seedOfflineDatabase().catch(console.error);
  }, []);

  // Total cart items count
  const cartItemCount = Object.values(cart).reduce<number>(
    (sum, qty) => sum + (Number(qty) || 0),
    0
  );

  // Cart operations
  const handleUpdateCartQty = (productId: string, delta: number) => {
    setCart((prev) => {
      const current = prev[productId] || 0;
      const next = current + delta;
      if (next <= 0) {
        const { [productId]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [productId]: next };
    });
  };

  const handleSetCartQty = (productId: string, quantity: number) => {
    setCart((prev) => {
      if (quantity <= 0) {
        const { [productId]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [productId]: quantity };
    });
  };

  const handleRemoveItem = (productId: string) => {
    setCart((prev) => {
      const { [productId]: _, ...rest } = prev;
      return rest;
    });
  };

  // Check-In handler
  const handleCheckInSuccess = (
    cust: Customer,
    checkInData: { timestamp: string; lat: number; lng: number; accuracyMeters: number }
  ) => {
    setCheckedInCustomerIds((prev) => new Set([...prev, cust.id]));
    setToastMessage(`✓ Check-in thành công tại ${cust.name} (${checkInData.timestamp})`);
    setTimeout(() => setToastMessage(null), 4000);
    onPersistCheckIn?.({
      customerId: cust.id,
      lat: checkInData.lat,
      lng: checkInData.lng,
    });
  };

  // Submit Order from drawer
  const handleSubmitFinalOrder = async (orderPayload: {
    customer: Customer;
    items: { product: Product; quantity: number; unitPrice: number; subtotal: number }[];
    totalAmount: number;
    discountPercent?: number;
    discountAmount?: number;
    promotionNotes?: string;
    totalLiters?: number;
    drumDelivered: number;
    drumReturned: number;
    drumDepositAmount: number;
    signatureBase64?: string;
    isEmergencyApproved: boolean;
    emergencyReason?: string;
    cashCollected?: number;
  }) => {
    const newOrder: Order = {
      id: `ORD-${Date.now().toString().slice(-6)}`,
      customer: orderPayload.customer.name,
      customerId: orderPayload.customer.id,
      customerType: orderPayload.customer.type,
      createdAt: new Date().toISOString(),
      status: 'Chờ duyệt',
      discountPercent: orderPayload.discountPercent,
      discountAmount: orderPayload.discountAmount,
      promotionNotes: orderPayload.promotionNotes,
      totalLiters: orderPayload.totalLiters,
      drumDelivered: orderPayload.drumDelivered,
      drumReturned: orderPayload.drumReturned,
      drumDepositAmount: orderPayload.drumDepositAmount,
      isCreditOverride: orderPayload.isEmergencyApproved,
      creditOverrideReason: orderPayload.emergencyReason,
      creditOverrideStatus: orderPayload.isEmergencyApproved ? 'PENDING' : undefined,
      items: orderPayload.items.map((it) => ({
        productId: it.product.id,
        productName: it.product.name,
        sku: it.product.sku,
        quantity: it.quantity,
        unitPrice: it.unitPrice,
        total: it.subtotal,
      })),
      total: orderPayload.totalAmount,
      drumExchange: {
        delivered: orderPayload.drumDelivered,
        returned: orderPayload.drumReturned,
      },
      signature: orderPayload.signatureBase64,
      isOverCredit: orderPayload.isEmergencyApproved,
    };

    if (orderPayload.cashCollected && orderPayload.cashCollected > 0) {
      handleCollectCashDebt(orderPayload.customer.id, orderPayload.cashCollected);
    }

    if (isGlobalOffline) {
      await enqueueOfflineOrder(newOrder);
    }
    onSubmitOrder(newOrder, isGlobalOffline);
    setCart({});
    setIsReviewDrawerOpen(false);
    setLastSubmittedOrder(newOrder);
    setReceiptOrder(newOrder);

    setToastMessage(
      isGlobalOffline
        ? `Đã lưu đơn ${newOrder.id} vào hàng đợi Ngoại tuyến (IndexedDB)!`
        : `Tạo đơn ${newOrder.id} thành công! Kế toán kho đã nhận.`
    );
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Collect cash debt handler
  const handleCollectCashDebt = (customerId: string, amount: number) => {
    if (onPayDebt) {
      onPayDebt(customerId, amount);
    }
    recordOfflineCollection({
      id: `COL-${Date.now()}`,
      customerId,
      customerName: activeCustomer.name,
      amount,
      collectedAt: new Date().toISOString(),
      synced: !isGlobalOffline,
    });
  };

  // Quick sync offline queue
  const handleQuickSync = () => {
    setIsSyncing(true);
    soundFX.playClick();
    setTimeout(() => {
      onSyncOfflineQueue();
      setIsSyncing(false);
      setToastMessage('Đã đồng bộ toàn bộ đơn hàng offline lên máy chủ CRM!');
      setTimeout(() => setToastMessage(null), 3000);
    }, 1200);
  };

  return (
    <div id="sales-pwa-app-root" className="w-full flex flex-col space-y-4">
      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed top-16 inset-x-4 z-50 max-w-md mx-auto bg-slate-900 text-white text-xs font-bold px-4 py-3 rounded-2xl shadow-2xl border border-amber-500/50 flex items-center justify-between gap-2 backdrop-blur-md animate-in slide-in-from-top duration-200">
          <span className="truncate">{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="text-slate-400 p-1 cursor-pointer">
            &times;
          </button>
        </div>
      )}

      {/* Top Field Operations Toolbar (Integrated Full Width, No Fixed Phone Shell) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Left: Active Route & Selected Customer Info */}
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="w-11 h-11 rounded-2xl bg-amber-500 text-slate-950 font-black text-xs flex items-center justify-center font-mono shrink-0 shadow-xs">
            GPS
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-amber-700 font-extrabold uppercase tracking-wider font-mono bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/60">
                {activeCustomer.route || 'Tuyến T3: KCN Tân Bình - Vĩnh Lộc'}
              </span>
              {checkedInCustomerIds.has(activeCustomer.id) && (
                <span className="inline-flex items-center gap-1 text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Đã Check-in
                </span>
              )}
            </div>
            <h2 className="text-base sm:text-lg lg:text-xl font-black text-slate-900 truncate mt-1">
              Điểm bán đang chọn: <span className="text-amber-600">{activeCustomer.name}</span>
            </h2>
          </div>
        </div>

        {/* Center: Clean Sub-tabs (Route Map vs Catalog) */}
        <div className="flex items-center bg-slate-100/90 p-1.5 rounded-2xl self-start lg:self-center">
          <button
            onClick={() => setActiveTab('route')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'route'
                ? 'bg-white text-slate-900 shadow-xs font-black'
                : 'text-slate-600 hover:text-slate-900 font-medium'
            }`}
          >
            <MapPin className="w-4 h-4 text-amber-500" />
            <span>Bản Đồ Tuyến &amp; Check-in</span>
          </button>
          <button
            onClick={() => setActiveTab('catalog')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'catalog'
                ? 'bg-amber-500 text-slate-950 shadow-xs font-black'
                : 'text-slate-600 hover:text-slate-900 font-medium'
            }`}
          >
            <ShoppingCart className="w-4 h-4" />
            <span>Đặt Hàng Nhanh</span>
            {cartItemCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-slate-950 text-white text-xs font-mono font-bold flex items-center justify-center">
                {cartItemCount}
              </span>
            )}
          </button>
        </div>

        {/* Right: Cart Review Trigger & Offline Status Toggle */}
        <div className="flex items-center gap-2.5 self-end lg:self-center">
          {/* Quick Review Drawer Button */}
          <button
            onClick={() => setIsReviewDrawerOpen(true)}
            className="h-10 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-bold flex items-center gap-2 shadow-xs transition-all cursor-pointer relative"
          >
            <ShoppingCart className="w-4 h-4 text-amber-400" />
            <span>Giỏ hàng</span>
            {cartItemCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 text-xs font-black font-mono flex items-center justify-center">
                {cartItemCount}
              </span>
            )}
          </button>

          {/* Offline/Online toggle */}
          <button
            onClick={onToggleGlobalOffline}
            className={`h-10 px-3.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 border transition-all cursor-pointer ${
              isGlobalOffline
                ? 'bg-amber-500/10 text-amber-700 border-amber-300 hover:bg-amber-500/20'
                : 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100'
            }`}
            title="Bật/Tắt chế độ Offline-First"
          >
            {isGlobalOffline ? (
              <>
                <CloudOff className="w-4 h-4 text-amber-600" />
                <span className="font-mono text-xs">Ngoại tuyến</span>
              </>
            ) : (
              <>
                <Wifi className="w-4 h-4 text-emerald-600" />
                <span className="font-mono text-xs">Online 4G</span>
              </>
            )}
          </button>

          {/* Sync Pending Queue */}
          {offlineQueue.length > 0 && (
            <button
              onClick={handleQuickSync}
              disabled={isSyncing}
              className="h-10 px-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs sm:text-sm font-black flex items-center gap-2 shadow-xs transition-all cursor-pointer font-mono"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>Đồng bộ ({offlineQueue.length})</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Module Content: Fully Expanded Width */}
      <div className="w-full">
        {activeTab === 'route' && (
          <PwaRouteMap
            customers={customers}
            activeCustomer={activeCustomer}
            onSelectCustomer={(c) => setActiveCustomerId(c.id)}
            onCheckInSuccess={handleCheckInSuccess}
            checkedInCustomerIds={checkedInCustomerIds}
            onNavigateToCatalog={() => setActiveTab('catalog')}
          />
        )}

        {activeTab === 'catalog' && (
          <PwaFastCatalog
            products={products}
            activeCustomer={activeCustomer}
            cart={cart}
            onUpdateCartQty={handleUpdateCartQty}
            onSetCartQty={handleSetCartQty}
            onOpenReviewDrawer={() => setIsReviewDrawerOpen(true)}
          />
        )}
      </div>

      {/* Floating Quick Action Bar for Last Created Order (Print & Zalo) */}
      {lastSubmittedOrder && !receiptOrder && (
        <div className="fixed bottom-20 right-4 z-40 animate-in slide-in-from-bottom-3 duration-200 flex items-center gap-2">
          <button
            onClick={() => setShowZaloModal(true)}
            className="flex items-center gap-1.5 rounded-2xl bg-blue-600 px-3.5 py-3 font-bold text-white shadow-xl hover:bg-blue-500 active:scale-95 transition-all cursor-pointer text-xs sm:text-sm"
            title="Gửi xác nhận đơn hàng qua Zalo"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Gửi Zalo</span>
          </button>
          <button
            onClick={() => setReceiptOrder(lastSubmittedOrder)}
            className="flex items-center gap-1.5 rounded-2xl bg-slate-900 px-4 py-3 font-bold text-white shadow-xl hover:bg-slate-800 active:scale-95 transition-all cursor-pointer text-xs sm:text-sm"
            title="In phiếu xuất kho K80"
          >
            <Printer className="w-4 h-4" />
            <span>In Phiếu ({lastSubmittedOrder.id.slice(-6)})</span>
          </button>
        </div>
      )}

      {/* Review Drawer Modal (Slide up from bottom / side) */}
      {isReviewDrawerOpen && (
        <PwaOrderReviewDrawer
          activeCustomer={activeCustomer}
          products={products}
          cart={cart}
          onUpdateCartQty={handleUpdateCartQty}
          onRemoveItem={handleRemoveItem}
          isOffline={isGlobalOffline}
          onClose={() => setIsReviewDrawerOpen(false)}
          onSubmitFinalOrder={handleSubmitFinalOrder}
          onCollectCashDebt={handleCollectCashDebt}
        />
      )}

      {/* Mobile Thermal / A4 Print Receipt Modal */}
      <OrderPrintReceipt
        order={receiptOrder}
        customer={activeCustomer}
        isOpen={Boolean(receiptOrder)}
        onClose={() => setReceiptOrder(null)}
      />

      {/* 1-Click Zalo Direct Chat Notification Modal */}
      <ZaloShareModal
        isOpen={showZaloModal}
        onClose={() => setShowZaloModal(false)}
        customer={activeCustomer}
        order={lastSubmittedOrder}
        initialTemplate="order"
      />
    </div>
  );
}
