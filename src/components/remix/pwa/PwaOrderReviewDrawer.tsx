"use client";
import { useState, useRef, useEffect, useMemo, type MouseEvent, type TouchEvent } from 'react';
import { Customer, Product, Order } from '../../types';
import { formatVND } from '../../mockData';
import { soundFX } from '../../utils/audio';
import {
  X,
  Trash2,
  Plus,
  Minus,
  AlertOctagon,
  ShieldCheck,
  DollarSign,
  Send,
  CloudOff,
  Eraser,
  PenTool,
  CheckCircle2,
  Package,
  Layers,
  Sparkles,
} from 'lucide-react';

interface PwaOrderReviewDrawerProps {
  activeCustomer: Customer;
  products: Product[];
  cart: Record<string, number>;
  onUpdateCartQty: (productId: string, delta: number) => void;
  onRemoveItem: (productId: string) => void;
  isOffline: boolean;
  onClose: () => void;
  onSubmitFinalOrder: (orderPayload: {
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
    cashCollected?: number;
  }) => void;
  onCollectCashDebt: (customerId: string, amount: number) => void;
}

export default function PwaOrderReviewDrawer({
  activeCustomer,
  products,
  cart,
  onUpdateCartQty,
  onRemoveItem,
  isOffline,
  onClose,
  onSubmitFinalOrder,
  onCollectCashDebt,
}: PwaOrderReviewDrawerProps) {
  // Local debt adjustment state (e.g. if cash collected on the spot)
  const [cashCollected, setCashCollected] = useState<number>(0);
  const [showCashCollectModal, setShowCashCollectModal] = useState<boolean>(false);
  const [cashInputVal, setCashInputVal] = useState<string>('5000000');

  // Trade Discount and Promo state
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [promotionNotes, setPromotionNotes] = useState<string>('');

  // Emergency manager approval state
  const [isEmergencyApproved, setIsEmergencyApproved] = useState<boolean>(false);
  const [showEmergencyModal, setShowEmergencyModal] = useState<boolean>(false);
  const [emergencyReason, setEmergencyReason] = useState<string>('Khách hàng VIP, đang thay nhớt cho 5 xe container tại bãi');

  // Steel Drum handover state
  const [drumDelivered, setDrumDelivered] = useState<number>(0);
  const [drumReturned, setDrumReturned] = useState<number>(0);
  const DRUM_DEPOSIT_UNIT_PRICE = 300000; // 300,000 VND / steel drum

  // Digital Signature Canvas
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [hasSignature, setHasSignature] = useState<boolean>(false);

  // Derive cart items
  const cartItems = useMemo(() => {
    return Object.entries(cart)
      .filter(([_, qty]) => qty > 0)
      .map(([prodId, qty]) => {
        const product = products.find((p) => p.id === prodId)!;
        const unitPrice =
          activeCustomer.type === 'Đội xe'
            ? product.priceFleet
            : activeCustomer.type === 'Thợ'
            ? product.priceMechanic
            : product.priceDealer;
        return {
          product,
          quantity: qty,
          unitPrice,
          subtotal: qty * unitPrice,
        };
      });
  }, [cart, products, activeCustomer]);

  // Volume / Liter calculation helper
  const getVolLiters = (p: Product) => {
    if (p.packageType === 'Phuy 200L') return 200;
    if (p.packageType === 'Thùng 18L') return 18;
    if (p.packageType === 'Xô 4L') return 4;
    return 1;
  };
  const totalLiters = cartItems.reduce((sum, item) => sum + item.quantity * getVolLiters(item.product), 0);

  // Auto detect if drum packaging is in order to set initial delivered drums
  useEffect(() => {
    let drumCount = 0;
    cartItems.forEach((item) => {
      if (item.product.packageType === 'Phuy 200L') {
        drumCount += item.quantity;
      }
    });
    setDrumDelivered(drumCount);
  }, [cartItems]);

  // Financial calculations with discount
  const rawOrderTotal = cartItems.reduce((sum, item) => sum + item.subtotal, 0);
  const discountAmount = Math.round((rawOrderTotal * discountPercent) / 100);
  const netGoodsTotal = Math.max(0, rawOrderTotal - discountAmount);
  const netDrumChange = drumDelivered - drumReturned;
  const drumDepositTotal = netDrumChange * DRUM_DEPOSIT_UNIT_PRICE;
  // Net payable = Oil total + Drum deposit change (if returned > delivered, deduct directly from oil total)
  const newOrderTotal = Math.max(0, netGoodsTotal + drumDepositTotal);

  // Effective outstanding debt after cash collected at spot
  const effectiveCurrentDebt = Math.max(0, activeCustomer.currentDebt - cashCollected);
  const creditLimit = activeCustomer.creditLimit || 50000000;
  const totalProjectedDebt = effectiveCurrentDebt + newOrderTotal;
  const isOverCredit = totalProjectedDebt > creditLimit;
  const overCreditAmount = Math.max(0, totalProjectedDebt - creditLimit);

  // Debt ratios for the multi-segment bar
  const currentDebtRatio = Math.min(100, (effectiveCurrentDebt / creditLimit) * 100);
  const newOrderRatio = Math.min(100 - currentDebtRatio, (newOrderTotal / creditLimit) * 100);
  const overCreditRatio = isOverCredit
    ? Math.min(50, ((totalProjectedDebt - creditLimit) / creditLimit) * 100)
    : 0;

  // Canvas Drawing Handlers
  const startDrawing = (e: MouseEvent<HTMLCanvasElement> | TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    setHasSignature(true);
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
  };

  const draw = (e: MouseEvent<HTMLCanvasElement> | TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#0F172A';
    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  // Cash collection confirmation
  const handleConfirmCashCollection = () => {
    const amount = Number(cashInputVal) || 0;
    if (amount > 0) {
      setCashCollected((prev) => prev + amount);
      onCollectCashDebt(activeCustomer.id, amount);
      soundFX.playSuccess();
      setShowCashCollectModal(false);
    }
  };

  // Submit Final Order
  const handleFinalSubmit = () => {
    if (cartItems.length === 0) return;
    if (isOverCredit && !isEmergencyApproved) return;

    let signatureBase64: string | undefined = undefined;
    if (canvasRef.current && hasSignature) {
      signatureBase64 = canvasRef.current.toDataURL('image/png');
    }

    soundFX.playSuccess();
    onSubmitFinalOrder({
      customer: activeCustomer,
      items: cartItems,
      totalAmount: newOrderTotal,
      discountPercent,
      discountAmount,
      promotionNotes: promotionNotes.trim() || undefined,
      totalLiters,
      drumDelivered,
      drumReturned,
      drumDepositAmount: drumDepositTotal,
      signatureBase64,
      isEmergencyApproved,
      cashCollected,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end bg-slate-950/70 backdrop-blur-xs select-none">
      {/* Tap backdrop to dismiss */}
      <div className="flex-1" onClick={onClose} />

      {/* Drawer Container */}
      <div className="bg-white rounded-t-3xl border-t border-slate-200 shadow-2xl max-w-xl sm:max-w-2xl mx-auto w-full max-h-[90vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-200">
        {/* Top Header & Drag Handle */}
        <div className="p-5 pb-3 border-b border-slate-100 flex flex-col items-center">
          <div className="w-12 h-1.5 bg-slate-300 rounded-full mb-3" />
          <div className="w-full flex items-center justify-between">
            <div>
              <div className="text-xs font-extrabold text-amber-600 uppercase font-mono tracking-wider">
                Xác Nhận &amp; Chốt Đơn Hàng
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight mt-0.5">
                {activeCustomer.name}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-slate-100 text-slate-500 hover:text-slate-800 flex items-center justify-center cursor-pointer transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* Section 1: Itemized Cart List */}
          <div>
            <div className="text-xs sm:text-sm font-extrabold text-slate-600 uppercase tracking-wider mb-2.5 flex items-center justify-between">
              <span>Sản phẩm trong giỏ ({cartItems.length})</span>
              <span className="font-mono text-slate-800 font-black text-sm">{formatVND(rawOrderTotal)}</span>
            </div>

            {cartItems.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-sm font-medium">
                Chưa có sản phẩm nào trong giỏ hàng
              </div>
            ) : (
              <div className="space-y-2.5">
                {cartItems.map((item) => (
                  <div
                    key={item.product.id}
                    className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="font-extrabold text-sm sm:text-base text-slate-900 truncate">
                        {item.product.name}
                      </div>
                      <div className="text-xs sm:text-sm text-slate-500 flex items-center gap-2 mt-1">
                        <span className="font-mono text-slate-700 font-bold">
                          {formatVND(item.unitPrice)}
                        </span>
                        <span>&times;</span>
                        <span className="font-mono font-black text-amber-800">
                          {item.quantity} {item.product.unit}
                        </span>
                        <span className="text-slate-300">|</span>
                        <span className="font-mono font-black text-slate-900">
                          = {formatVND(item.subtotal)}
                        </span>
                      </div>
                    </div>

                    {/* Stepper & Trash */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => onUpdateCartQty(item.product.id, -1)}
                        className="w-9 h-9 rounded-xl bg-white border border-slate-300 flex items-center justify-center text-slate-700 active:scale-95 cursor-pointer font-bold"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-7 text-center font-mono font-black text-sm text-slate-900">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => onUpdateCartQty(item.product.id, 1)}
                        className="w-9 h-9 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold active:scale-95 cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onRemoveItem(item.product.id)}
                        className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 flex items-center justify-center ml-1 cursor-pointer"
                        title="Xóa món này"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 2: Steel Drum Ledger & Handover Form */}
          <div className="p-4 rounded-2xl bg-sky-50/70 border border-sky-200 space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="text-sm font-black text-sky-950 flex items-center gap-2">
                <Package className="w-5 h-5 text-sky-600" />
                <span>Sổ Quản Lý Vỏ Phuy Sắt (200L)</span>
              </div>
              <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-sky-200 text-sky-900 font-bold">
                Cọc 300k/vỏ
              </span>
            </div>

            {/* 3-Part Drum Balance Header */}
            <div className="grid grid-cols-3 gap-2.5 text-center">
              <div className="p-2.5 rounded-xl bg-white border border-sky-100 shadow-2xs">
                <div className="text-xs text-slate-500 font-medium">Đang giữ tại tiệm</div>
                <div className="text-base sm:text-lg font-black font-mono text-amber-700 mt-0.5">
                  {activeCustomer.drumBalance ?? activeCustomer.emptyDrums ?? 8} Vỏ
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-white border border-sky-100 shadow-2xs">
                <div className="text-xs text-slate-500 font-medium">Thu hồi hôm nay</div>
                <div className="text-base sm:text-lg font-black font-mono text-emerald-700 mt-0.5">
                  {drumReturned} Vỏ
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-white border border-sky-100 shadow-2xs">
                <div className="text-xs text-slate-500 font-medium">Tiền cọc phát sinh</div>
                <div className="text-sm sm:text-base font-black font-mono text-sky-800 mt-0.5 truncate">
                  {formatVND(drumDepositTotal)}
                </div>
              </div>
            </div>

            {/* Steppers for Delivered and Returned Drums */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="p-3 rounded-xl bg-white border border-slate-200">
                <div className="text-xs font-bold text-slate-700 mb-1.5">Giao mới kỳ này:</div>
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => setDrumDelivered((prev) => Math.max(0, prev - 1))}
                    className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 font-bold flex items-center justify-center cursor-pointer"
                  >
                    -
                  </button>
                  <span className="font-mono font-black text-sm text-sky-800">
                    +{drumDelivered} phuy
                  </span>
                  <button
                    onClick={() => setDrumDelivered((prev) => prev + 1)}
                    className="w-8 h-8 rounded-lg bg-sky-600 text-white font-bold flex items-center justify-center cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-white border border-slate-200">
                <div className="text-xs font-bold text-slate-700 mb-1.5">Thu hồi vỏ rỗng:</div>
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => setDrumReturned((prev) => Math.max(0, prev - 1))}
                    className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 font-bold flex items-center justify-center cursor-pointer"
                  >
                    -
                  </button>
                  <span className="font-mono font-black text-sm text-emerald-700">
                    -{drumReturned} vỏ
                  </span>
                  <button
                    onClick={() => setDrumReturned((prev) => prev + 1)}
                    className="w-8 h-8 rounded-lg bg-emerald-600 text-white font-bold flex items-center justify-center cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            {netDrumChange !== 0 && (
              <div className="mt-2.5 p-2 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-between text-xs font-mono">
                <span className="text-slate-600 font-semibold">
                  {netDrumChange < 0
                    ? `Hoàn cọc ${Math.abs(netDrumChange)} vỏ cũ (Trừ tiền dầu):`
                    : `Cọc thêm ${netDrumChange} phuy mới:`}
                </span>
                <span className={`font-bold ${netDrumChange < 0 ? 'text-emerald-700' : 'text-sky-800'}`}>
                  {netDrumChange < 0
                    ? `-${formatVND(Math.abs(drumDepositTotal))}`
                    : `+${formatVND(drumDepositTotal)}`}
                </span>
              </div>
            )}
          </div>

          {/* Section: Trade Discount & Promotions */}
          <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-sm font-black text-amber-950 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-600" />
                <span>Chiết Khấu &amp; Quà Tặng Khuyến Mãi</span>
              </div>
              <span className="text-xs font-mono font-bold text-amber-800 bg-amber-200/80 px-2.5 py-0.5 rounded-full">
                Sản lượng: {totalLiters} Lít
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Chiết khấu (%)
                </label>
                <div className="flex items-center gap-1.5">
                  {[0, 3, 5, 8].map((pct) => (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => setDiscountPercent(pct)}
                      className={`px-2 py-1 rounded-lg text-xs font-bold font-mono cursor-pointer transition ${
                        discountPercent === pct
                          ? 'bg-amber-500 text-slate-950 shadow-xs font-black'
                          : 'bg-white border border-slate-200 text-slate-600 hover:bg-amber-100/50'
                      }`}
                    >
                      {pct}%
                    </button>
                  ))}
                </div>
                {discountAmount > 0 && (
                  <div className="mt-1 text-[11px] font-mono font-bold text-emerald-700">
                    Giảm: -{formatVND(discountAmount)}
                  </div>
                )}
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Quà tặng / Khuyến mại kèm
                </label>
                <input
                  type="text"
                  value={promotionNotes}
                  onChange={(e) => setPromotionNotes(e.target.value)}
                  placeholder="VD: Tặng 1 áo mưa Castrol"
                  className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-amber-500 font-medium"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Credit Guard Real-time Verification */}
          <div className="p-4 rounded-2xl bg-slate-900 text-white space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="text-sm font-black text-slate-200 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-amber-400" />
                <span>Hạn Mức Công Nợ (Credit Guard)</span>
              </div>
              <span className="font-mono text-xs sm:text-sm font-bold text-slate-300">
                Hạn mức: {formatVND(creditLimit)}
              </span>
            </div>

            {/* Debt Breakdown Table */}
            <div className="text-xs sm:text-sm space-y-1.5 font-mono pt-1">
              <div className="flex justify-between text-slate-400">
                <span>1. Dư nợ hiện tại:</span>
                <span className="text-white font-bold">{formatVND(effectiveCurrentDebt)}</span>
              </div>
              {cashCollected > 0 && (
                <div className="flex justify-between text-emerald-400 text-xs">
                  <span>&bull; Đã thu tiền mặt tại chỗ:</span>
                  <span>-{formatVND(cashCollected)}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-400">
                <span>2. Giá trị đơn mới (+cọc vỏ):</span>
                <span className="text-amber-400 font-bold">+{formatVND(newOrderTotal)}</span>
              </div>
              <div className="flex justify-between text-slate-200 border-t border-slate-800 pt-1.5 font-bold text-sm">
                <span>Dự kiến ghi nợ sau đơn:</span>
                <span className={isOverCredit ? 'text-rose-400 font-black' : 'text-emerald-400'}>
                  {formatVND(totalProjectedDebt)}
                </span>
              </div>
            </div>

            {/* Multi-Segment Credit Progress Bar */}
            <div className="space-y-1">
              <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden flex">
                {/* Segment 1: Current Debt (Blue) */}
                <div
                  style={{ width: `${currentDebtRatio}%` }}
                  className="bg-blue-500 h-full transition-all duration-300"
                  title={`Nợ cũ: ${currentDebtRatio.toFixed(0)}%`}
                />
                {/* Segment 2: New Order (Amber / Striped) */}
                <div
                  style={{ width: `${newOrderRatio}%` }}
                  className={`h-full transition-all duration-300 ${
                    isOverCredit ? 'bg-rose-500 animate-pulse' : 'bg-amber-400'
                  }`}
                  title={`Đơn mới: ${newOrderRatio.toFixed(0)}%`}
                />
              </div>

              <div className="flex justify-between text-xs font-mono text-slate-400">
                <span>0đ</span>
                <span>{formatVND(creditLimit)} (Ngưỡng khóa)</span>
              </div>
            </div>

            {/* Status Feedback Banner */}
            {isOverCredit ? (
              <div className="p-3.5 rounded-xl bg-rose-950/80 border border-rose-500 text-rose-200 text-xs sm:text-sm space-y-2.5">
                <div className="flex items-center gap-2 font-bold text-rose-300">
                  <AlertOctagon className="w-5 h-5 text-rose-400 shrink-0 animate-bounce" />
                  <span>CẢNH BÁO: ĐƠN HÀNG VƯỢT HẠN MỨC (+{formatVND(overCreditAmount)})</span>
                </div>
                <p className="text-xs text-rose-300/90 leading-relaxed">
                  Đơn hàng bị chặn tự động. Chọn 1 trong 2 giải pháp bên dưới để tiếp tục:
                </p>

                {/* 2 Explicit Action Buttons */}
                <div className="grid grid-cols-2 gap-2.5 pt-1">
                  <button
                    onClick={() => setShowCashCollectModal(true)}
                    className="h-11 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition-transform cursor-pointer"
                  >
                    <DollarSign className="w-4 h-4" />
                    <span>Thu Tiền Mặt Ngay</span>
                  </button>

                  <button
                    onClick={() => setShowEmergencyModal(true)}
                    className="h-11 rounded-xl bg-amber-600 hover:bg-amber-500 active:scale-95 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition-transform cursor-pointer"
                  >
                    <AlertOctagon className="w-4 h-4" />
                    <span>Xin GĐ Duyệt Khẩn</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-emerald-950/70 border border-emerald-500/50 text-emerald-300 text-xs sm:text-sm flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <span>
                  Trong hạn mức an toàn! Khách hàng còn được nợ thêm{' '}
                  <strong className="font-mono text-white text-sm">
                    {formatVND(creditLimit - totalProjectedDebt)}
                  </strong>
                </span>
              </div>
            )}

            {isEmergencyApproved && (
              <div className="p-3 rounded-xl bg-amber-950/80 border border-amber-400 text-amber-200 text-xs sm:text-sm flex items-center gap-2.5">
                <Sparkles className="w-5 h-5 text-amber-400 shrink-0" />
                <span>Đã kích hoạt phê duyệt bảo lãnh vượt nợ khẩn cấp từ Giám Đốc!</span>
              </div>
            )}
          </div>

          {/* Section 4: Digital Signature Canvas */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="text-xs sm:text-sm font-extrabold text-slate-800 flex items-center gap-2">
                <PenTool className="w-4 h-4 text-slate-700" />
                <span>Chữ Ký Xác Nhận Nhận Hàng &amp; Vỏ (Điện Tử)</span>
              </div>
              {hasSignature && (
                <button
                  onClick={clearCanvas}
                  className="text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1 cursor-pointer"
                >
                  <Eraser className="w-3.5 h-3.5" />
                  <span>Ký lại</span>
                </button>
              )}
            </div>

            {/* Signature Canvas Pad */}
            <div className="relative border-2 border-dashed border-slate-300 rounded-xl bg-slate-50 overflow-hidden touch-none">
              <canvas
                ref={canvasRef}
                width={480}
                height={130}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
                className="w-full h-[130px] cursor-crosshair"
              />
              {!hasSignature && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-slate-400 text-xs sm:text-sm font-medium">
                  Chủ garage hoặc tài xế ký tay vào đây
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Drawer Sticky Footer: Submit Action */}
        <div className="p-4 sm:p-5 bg-slate-900 border-t border-slate-800 shrink-0 space-y-3">
          <div className="space-y-1 font-mono">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Tiền hàng (dầu nhớt):</span>
              <span className="font-semibold text-slate-300">{formatVND(netGoodsTotal)}</span>
            </div>
            {drumDepositTotal !== 0 && (
              <div className="flex items-center justify-between text-xs">
                <span className={drumDepositTotal < 0 ? 'text-emerald-400 font-bold' : 'text-sky-300 font-bold'}>
                  {drumDepositTotal < 0 ? 'Trừ tiền cọc vỏ cũ thu về:' : 'Cọc thêm phuy mới:'}
                </span>
                <span className={`font-bold ${drumDepositTotal < 0 ? 'text-emerald-400' : 'text-sky-300'}`}>
                  {drumDepositTotal < 0
                    ? `-${formatVND(Math.abs(drumDepositTotal))}`
                    : `+${formatVND(drumDepositTotal)}`}
                </span>
              </div>
            )}
            <div className="flex items-center justify-between text-xs sm:text-sm text-slate-200 pt-1.5 border-t border-slate-800">
              <span className="font-bold text-white">Số tiền phải thu (Thực tế):</span>
              <span className="text-xl sm:text-2xl lg:text-3xl font-black text-amber-400 font-mono">
                {formatVND(newOrderTotal)}
              </span>
            </div>
          </div>

          <button
            id="pwa-final-submit-order-btn"
            onClick={handleFinalSubmit}
            disabled={cartItems.length === 0 || (isOverCredit && !isEmergencyApproved)}
            className={`w-full h-14 min-h-[52px] rounded-2xl font-black text-sm sm:text-base flex items-center justify-center gap-2.5 shadow-xl transition-all cursor-pointer ${
              cartItems.length === 0 || (isOverCredit && !isEmergencyApproved)
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                : isOffline
                ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 active:scale-[0.98]'
                : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 active:scale-[0.98]'
            }`}
          >
            {isOffline ? (
              <>
                <CloudOff className="w-5 h-5 text-slate-950" />
                <span>LƯU ĐƠN VÀO BỘ NHỚ TẠM THIẾT BỊ ({formatVND(newOrderTotal)})</span>
              </>
            ) : (
              <>
                <Send className="w-5 h-5 text-slate-950" />
                <span>GỬI ĐƠN HÀNG LÊN HỆ THỐNG ({formatVND(newOrderTotal)})</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Cash Collection Modal */}
      {showCashCollectModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-emerald-600" />
                <span>Thu Nợ Tiền Mặt Tại Chỗ</span>
              </h4>
              <button onClick={() => setShowCashCollectModal(false)} className="text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Nhận tiền mặt từ chủ tiệm <strong>{activeCustomer.name}</strong> để giảm dư nợ ngay tức thì:
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Số tiền thu được (VNĐ):
              </label>
              <input
                type="number"
                step="500000"
                min="0"
                value={cashInputVal}
                onChange={(e) => setCashInputVal(e.target.value)}
                className="w-full h-11 px-3 rounded-xl border border-slate-300 font-mono font-bold text-base focus:ring-2 focus:ring-emerald-500/50 outline-none"
              />
              <div className="text-[11px] text-slate-500 mt-1.5 flex justify-between font-mono">
                <span>Dư nợ còn lại sau thu:</span>
                <span className="font-bold text-emerald-700">
                  {formatVND(Math.max(0, activeCustomer.currentDebt - (Number(cashInputVal) || 0)))}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowCashCollectModal(false)}
                className="h-10 px-3 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Hủy
              </button>
              <button
                onClick={handleConfirmCashCollection}
                className="h-10 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md cursor-pointer"
              >
                Xác Nhận Đã Nhận Tiền
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Emergency Approval Request Modal */}
      {showEmergencyModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                <AlertOctagon className="w-4 h-4 text-amber-600" />
                <span>Yêu Cầu Bảo Lãnh Vượt Nợ Khẩn Cấp</span>
              </h4>
              <button onClick={() => setShowEmergencyModal(false)} className="text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Gửi yêu cầu tức thì kèm tọa độ GPS tới Giám Đốc Kinh Doanh để mở khóa đơn vượt hạn mức{' '}
              <strong className="font-mono text-rose-600">+{formatVND(overCreditAmount)}</strong>.
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Lý do bảo lãnh nghiệp vụ:
              </label>
              <textarea
                rows={3}
                value={emergencyReason}
                onChange={(e) => setEmergencyReason(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-amber-500/50 outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowEmergencyModal(false)}
                className="h-10 px-3 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Đóng
              </button>
              <button
                onClick={() => {
                  setIsEmergencyApproved(true);
                  setShowEmergencyModal(false);
                  soundFX.playSuccess();
                }}
                className="h-10 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold shadow-md cursor-pointer"
              >
                Mô Phỏng GĐ Duyệt Ngay
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
