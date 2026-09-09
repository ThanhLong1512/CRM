"use client";
import { useState, useRef, useEffect, FormEvent, MouseEvent, TouchEvent } from 'react';
import { Customer, DrumTransaction } from '../types';
import { formatVND } from '../mockData';
import { soundFX } from '../utils/audio';
import {
  Package,
  ArrowRightLeft,
  Truck,
  Building2,
  DollarSign,
  FileCheck,
  RotateCcw,
  CheckCircle2,
  PenTool,
  Printer,
  X,
  History,
  ShieldCheck,
  Boxes,
} from 'lucide-react';
import { usePagination } from '../../hooks/usePagination';
import Pagination from '../common/Pagination';


interface DrumsViewProps {
  customers: Customer[];
  drumTransactions: DrumTransaction[];
  onUpdateDrumBalance: (
    customerId: string,
    delivered: number,
    returned: number,
    signature?: string,
    signedBy?: string
  ) => void;
  onSignTransaction?: (
    transactionId: string,
    signature: string,
    signedBy: string
  ) => void;
}

export default function DrumsView({
  customers,
  drumTransactions: initialDrumTransactions,
  onUpdateDrumBalance,
  onSignTransaction,
}: DrumsViewProps) {
  const [localTransactions, setLocalTransactions] = useState<DrumTransaction[]>(initialDrumTransactions);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(
    customers[0]?.id || ''
  );
  const [deliveredCount, setDeliveredCount] = useState<number | ''>('');
  const [returnedCount, setReturnedCount] = useState<number | ''>('');
  const [message, setMessage] = useState<string>('');

  // Keep local transactions in sync with prop updates
  useEffect(() => {
    setLocalTransactions(initialDrumTransactions);
  }, [initialDrumTransactions]);

  const {
    currentPage: txCurrentPage,
    pageSize: txPageSize,
    totalPages: txTotalPages,
    paginatedItems: paginatedTransactions,
    startIndex: txStartIndex,
    endIndex: txEndIndex,
    totalItems: txTotalItems,
    goToPage: goToTxPage,
    setPageSize: setTxPageSize,
  } = usePagination({
    items: localTransactions,
    initialPageSize: 6,
    pageSizeOptions: [6, 12, 24],
  });

  // Digital Signature Modal State
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [signedName, setSignedName] = useState('Trần Minh Đức (Chủ Garage)');
  const [targetTxForSignature, setTargetTxForSignature] = useState<DrumTransaction | null>(null);
  const [viewingProofTx, setViewingProofTx] = useState<DrumTransaction | null>(null);
  const [formSignature, setFormSignature] = useState<{ signature: string; signedBy: string } | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [hasSignature, setHasSignature] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);

  const activeCustomer = customers.find((c) => c.id === selectedCustomerId);

  // Drum Metrics
  const DEPOSIT_PRICE_PER_DRUM = 400000; // 400.000đ per steel drum
  const totalDrumsInMarket = customers.reduce(
    (sum, c) => sum + (c.emptyDrums || 0),
    0
  );
  const drumsInTransit = 8; // On return truck
  const totalDepositTiedUp = totalDrumsInMarket * DEPOSIT_PRICE_PER_DRUM;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!activeCustomer) return;

    const delivered = deliveredCount === '' ? 0 : Number(deliveredCount);
    const returned = returnedCount === '' ? 0 : Number(returnedCount);

    if (delivered === 0 && returned === 0) {
      setMessage('Vui lòng nhập số lượng Giao mới hoặc Thu hồi vỏ.');
      return;
    }

    if (returned > (activeCustomer.emptyDrums || 0) + delivered) {
      setMessage('Số lượng vỏ thu hồi không thể vượt quá số lượng vỏ thực tế khách đang giữ.');
      return;
    }

    onUpdateDrumBalance(
      activeCustomer.id,
      delivered,
      returned,
      formSignature?.signature,
      formSignature?.signedBy
    );
    soundFX.playSuccess();
    setMessage(
      `Đã cập nhật vỏ phuy 200L cho ${activeCustomer.name}: Giao +${delivered}, Thu -${returned}${
        formSignature ? ' (Kèm chữ ký e-PoD thực địa)' : ''
      }.`
    );

    setDeliveredCount('');
    setReturnedCount('');
    setFormSignature(null);
  };

  // Canvas Drawing Handlers
  const startDrawing = (e: MouseEvent<HTMLCanvasElement> | TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    setHasSignature(true);
    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: MouseEvent<HTMLCanvasElement> | TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#0F172A';
    ctx.lineTo(x, y);
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

  return (
    <div id="drums-view" className="w-full space-y-6">
      {/* 1. Header */}
      <div className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs sm:flex-row sm:items-center">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-extrabold tracking-tight text-slate-900 sm:text-2xl">
              Quản Lý &amp; Cấn Trừ Vòng Đời Vỏ Phuy Sắt 200L
            </h2>
            <span className="rounded-full border border-cyan-300 bg-cyan-100 px-2.5 py-0.5 text-xs font-bold text-cyan-900">
              200L Drum Asset Tracking
            </span>
          </div>
          <p className="mt-0.5 text-xs text-slate-500">
            Kiểm soát tài sản thế chân 400.000đ/vỏ, đối soát 2 chiều Giao mới - Thu hồi và ký biên bản điện tử
          </p>
        </div>

        <button
          onClick={() => setShowSignatureModal(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-cyan-600 px-4 py-2 text-xs font-bold text-white shadow-xs cursor-pointer hover:bg-cyan-700"
        >
          <PenTool className="w-4 h-4" />
          <span>Biên Bản Ký Nhận Vỏ</span>
        </button>
      </div>

      {/* 2. Top Drum Ledger Balance Cards (Bảng Cân Bằng Vỏ Phuy) */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {/* Card 1: Drums at customer garages */}
        <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div className="min-w-0">
            <div className="text-[11px] sm:text-xs text-slate-500 font-medium truncate">
              Vỏ Tại Khách Hàng
            </div>
            <div className="mt-1 sm:mt-2 text-xl sm:text-3xl font-black font-mono text-amber-700">
              {totalDrumsInMarket} <span className="text-xs sm:text-sm font-semibold text-slate-500">vỏ</span>
            </div>
            <div className="hidden sm:block text-[11px] text-amber-700 font-medium mt-1">
              Phân bổ trên {customers.filter((c) => (c.emptyDrums || 0) > 0).length} điểm bán &amp; đội xe
            </div>
          </div>
          <div className="size-10 sm:size-12 shrink-0 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center text-lg sm:text-xl">
            🛢️
          </div>
        </div>

        {/* Card 2: Drums in transit */}
        <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div className="min-w-0">
            <div className="text-[11px] sm:text-xs text-slate-500 font-medium truncate">
              Vỏ Trên Xe Về Kho
            </div>
            <div className="mt-1 sm:mt-2 text-xl sm:text-3xl font-black font-mono text-cyan-800">
              {drumsInTransit} <span className="text-xs sm:text-sm font-semibold text-slate-500">vỏ</span>
            </div>
            <div className="hidden sm:block text-[11px] text-cyan-700 font-medium mt-1">
              Đang trên 2 xe tải giao vận của công ty
            </div>
          </div>
          <div className="size-10 sm:size-12 shrink-0 rounded-2xl bg-cyan-100 text-cyan-800 flex items-center justify-center text-lg sm:text-xl">
            🚚
          </div>
        </div>

        {/* Card 3: Total Deposit Money tied up */}
        <div className="col-span-2 lg:col-span-1 bg-white p-3.5 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div className="min-w-0">
            <div className="text-[11px] sm:text-xs text-slate-500 font-medium truncate">
              Tiền Cọc Đang Treo
            </div>
            <div className="mt-1 sm:mt-2 text-lg sm:text-2xl font-black font-mono text-emerald-800">
              {formatVND(totalDepositTiedUp)}
            </div>
            <div className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5 sm:mt-1">
              Định mức: <strong>400.000 đ / vỏ</strong>
            </div>
          </div>
          <div className="size-10 sm:size-12 shrink-0 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center text-lg sm:text-xl">
            💵
          </div>
        </div>
      </div>

      {/* 3. Main Row: 2-Way Reconciliation Form & Realtime Customer Ledger */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 5 Cols: 2-Way Drum Transaction Form */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <ArrowRightLeft className="w-5 h-5 text-cyan-600" />
              <span>Đối Soát 2 Chiều Giao Nhận Vỏ</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Nhập số lượng phuy mới giao đi và vỏ rỗng thu hồi về từ điểm bán
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Chọn Điểm Bán / Gara Đối Tác:
              </label>
              <select
                value={selectedCustomerId}
                onChange={(e) => {
                  setSelectedCustomerId(e.target.value);
                  setMessage('');
                }}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-bold text-slate-900 focus:outline-none focus:border-cyan-500"
              >
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} (Đang giữ: {c.emptyDrums || 0} vỏ phuy)
                  </option>
                ))}
              </select>
            </div>

            {/* 2-Way Inputs: Delivered vs Returned */}
            <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              {/* Deliver column */}
              <div>
                <label className="block text-xs font-bold text-cyan-900 mb-1">
                  1. Giao Mới (+Phuy)
                </label>
                <input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={deliveredCount}
                  onChange={(e) =>
                    setDeliveredCount(e.target.value === '' ? '' : Number(e.target.value))
                  }
                  className="w-full px-3 py-2 rounded-lg border border-cyan-300 bg-white text-base font-mono font-black text-cyan-900 focus:border-cyan-500"
                />
                <div className="text-[10px] text-cyan-700 mt-1 font-semibold">Tăng nợ vỏ (+X)</div>
              </div>

              {/* Return column */}
              <div>
                <label className="block text-xs font-bold text-emerald-900 mb-1">
                  2. Thu Hồi (-Vỏ Rỗng)
                </label>
                <input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={returnedCount}
                  onChange={(e) =>
                    setReturnedCount(e.target.value === '' ? '' : Number(e.target.value))
                  }
                  className="w-full px-3 py-2 rounded-lg border border-emerald-300 bg-white text-base font-mono font-black text-emerald-900 focus:border-emerald-500"
                />
                <div className="text-[10px] text-emerald-700 mt-1 font-semibold">Cấn trừ trả vỏ (-Y)</div>
              </div>
            </div>

            {/* Net Effect Simulation */}
            {activeCustomer && (
              <div className="p-3 bg-cyan-50/70 border border-cyan-200 rounded-xl text-xs space-y-1">
                <div className="flex justify-between text-cyan-900">
                  <span>Số vỏ khách đang nợ trước giao dịch:</span>
                  <strong className="font-mono">{activeCustomer.emptyDrums || 0} vỏ</strong>
                </div>
                <div className="flex justify-between text-cyan-950 font-bold pt-1 border-t border-cyan-200/60">
                  <span>Số vỏ khách giữ sau giao dịch:</span>
                  <span className="font-mono text-base">
                    {Math.max(
                      0,
                      (activeCustomer.emptyDrums || 0) +
                        (Number(deliveredCount) || 0) -
                        (Number(returnedCount) || 0)
                    )}{' '}
                    vỏ
                  </span>
                </div>
              </div>
            )}

            {/* e-PoD Digital Signature trigger on form */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <PenTool className="w-3.5 h-3.5 text-cyan-700" />
                  <span>Ký nhận điện tử thực địa (Driver e-PoD)</span>
                </span>
                {formSignature ? (
                  <button
                    type="button"
                    onClick={() => {
                      setTargetTxForSignature(null);
                      clearCanvas();
                      setShowSignatureModal(true);
                    }}
                    className="text-[11px] text-cyan-700 hover:underline font-semibold"
                  >
                    Ký lại
                  </button>
                ) : null}
              </div>

              {formSignature ? (
                <div className="flex items-center gap-2.5 p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg">
                  <div className="h-10 w-28 bg-white border border-emerald-300 rounded overflow-hidden flex items-center justify-center p-0.5 shrink-0 shadow-2xs">
                    <img src={formSignature.signature} alt="Chữ ký" className="max-h-full max-w-full object-contain" />
                  </div>
                  <div className="text-[11px] min-w-0 flex-1">
                    <p className="font-bold text-emerald-900 truncate">✓ Đã ký: {formSignature.signedBy}</p>
                    <p className="text-[10px] text-emerald-700 font-medium">Bằng chứng pháp lý e-PoD hợp lệ</p>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setTargetTxForSignature(null);
                    setSignedName(activeCustomer ? `${activeCustomer.name} (Chủ Garage)` : 'Trần Minh Đức (Chủ Garage)');
                    clearCanvas();
                    setShowSignatureModal(true);
                  }}
                  className="w-full py-2 px-3 border border-dashed border-cyan-400 bg-cyan-50/50 hover:bg-cyan-50 rounded-lg text-xs font-bold text-cyan-800 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <PenTool className="w-3.5 h-3.5 text-cyan-700" />
                  <span>Ký nhận bàn giao vỏ tại chỗ (Touch Pad)</span>
                </button>
              )}
            </div>

            {message && (
              <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{message}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-cyan-700 hover:bg-cyan-800 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
            >
              Cập Nhật Biên Bản Đối Soát Vỏ
            </button>
          </form>
        </div>

        {/* Right 7 Cols: Realtime Drum Transactions Log */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-xs p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <History className="w-5 h-5 text-slate-600" />
                  <span>Lịch Sử Luân Chuyển Vỏ Phuy Sắt 200L</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Nhật ký chi tiết các lượt giao nhận và chữ ký xác thực e-PoD
                </p>
              </div>
            </div>

            {/* Mobile Transactions Cards (For small screens: compact, actionable, no horizontal table scroll) */}
            <div className="md:hidden space-y-2.5">
              {paginatedTransactions.map((tx) => (
                <div
                  key={tx.id}
                  className="p-3 rounded-xl border border-slate-200 bg-slate-50/60 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="min-w-0">
                      <span className="font-mono text-xs font-bold text-slate-500">#{tx.id}</span>
                      <h4 className="font-bold text-slate-900 text-xs truncate mt-0.5">{tx.customerName}</h4>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400 shrink-0">{tx.timestamp}</span>
                  </div>

                  <div className="flex items-center justify-between rounded-lg bg-white p-2 border border-slate-100 text-xs">
                    <div className="flex items-center gap-3 font-mono">
                      <span className="text-cyan-700 font-bold">Giao: {tx.delivered > 0 ? `+${tx.delivered}` : '-'}</span>
                      <span className="text-emerald-700 font-bold">Thu: {tx.returned > 0 ? `-${tx.returned}` : '-'}</span>
                    </div>
                    <div className="font-bold text-slate-900 font-mono">
                      Tồn: {tx.balanceAfter} vỏ
                    </div>
                  </div>

                  <div className="pt-0.5">
                    {tx.signature ? (
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5 text-emerald-800 min-w-0">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span className="font-semibold truncate text-[11px]">{tx.signedBy || 'Đã ký e-PoD'}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setViewingProofTx(tx)}
                          className="text-[11px] font-bold text-cyan-700 hover:underline cursor-pointer shrink-0 ml-2"
                        >
                          Xem e-PoD
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setTargetTxForSignature(tx);
                          setSignedName(
                            tx.customerName
                              ? `${tx.customerName} (Chủ Garage)`
                              : 'Chủ Garage / Người nhận'
                          );
                          clearCanvas();
                          setShowSignatureModal(true);
                        }}
                        className="w-full inline-flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-cyan-50 hover:bg-cyan-100 border border-cyan-300 text-cyan-800 text-xs font-bold cursor-pointer"
                      >
                        <PenTool className="w-3 h-3" />
                        <span>Ký nhận e-PoD</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Transactions Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase border-b border-slate-200">
                    <th className="py-2.5 px-3">Mã GD</th>
                    <th className="py-2.5 px-3">Điểm Bán / Garage</th>
                    <th className="py-2.5 px-3 text-cyan-800">Giao (+)</th>
                    <th className="py-2.5 px-3 text-emerald-800">Thu (-)</th>
                    <th className="py-2.5 px-3">Tồn Vỏ Sau GD</th>
                    <th className="py-2.5 px-3">Ký Nhận Điện Tử (e-PoD)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedTransactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-3 font-mono font-bold text-slate-700">{tx.id}</td>
                      <td className="py-3 px-3 font-semibold text-slate-900">{tx.customerName}</td>
                      <td className="py-3 px-3 font-mono font-bold text-cyan-700">
                        {tx.delivered > 0 ? `+${tx.delivered}` : '-'}
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-emerald-700">
                        {tx.returned > 0 ? `-${tx.returned}` : '-'}
                      </td>
                      <td className="py-3 px-3 font-mono font-extrabold text-slate-900">
                        {tx.balanceAfter} vỏ
                      </td>
                      <td className="py-3 px-3 text-slate-500">
                        {tx.signature ? (
                          <div className="space-y-1">
                            <div className="flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              <span className="font-bold text-emerald-900 truncate max-w-[130px]">
                                {tx.signedBy || 'Đã ký e-PoD'}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-slate-400 font-mono">{tx.timestamp}</span>
                              <button
                                type="button"
                                onClick={() => setViewingProofTx(tx)}
                                className="text-[10px] font-bold text-cyan-700 hover:text-cyan-900 hover:underline cursor-pointer"
                              >
                                Xem e-PoD
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <button
                              type="button"
                              onClick={() => {
                                setTargetTxForSignature(tx);
                                setSignedName(
                                  tx.customerName
                                    ? `${tx.customerName} (Chủ Garage)`
                                    : 'Chủ Garage / Người nhận'
                                );
                                clearCanvas();
                                setShowSignatureModal(true);
                              }}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-cyan-50 hover:bg-cyan-100 border border-cyan-300 text-cyan-800 text-[11px] font-bold transition shadow-2xs cursor-pointer"
                            >
                              <PenTool className="w-3 h-3 text-cyan-700" />
                              <span>Ký nhận e-PoD</span>
                            </button>
                            <div className="text-[10px] text-slate-400 font-mono">{tx.timestamp}</div>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 mt-4">
            <Pagination
              currentPage={txCurrentPage}
              totalPages={txTotalPages}
              pageSize={txPageSize}
              totalItems={txTotalItems}
              startIndex={txStartIndex}
              endIndex={txEndIndex}
              onPageChange={goToTxPage}
              onPageSizeChange={setTxPageSize}
              pageSizeOptions={[6, 12, 24]}
              compact
            />
          </div>
        </div>
      </div>

      {/* 4. Digital Signature Pad Modal */}
      {showSignatureModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h4 className="font-bold text-slate-900 text-base flex items-center gap-2">
                  <PenTool className="w-4 h-4 text-cyan-600" />
                  <span>
                    {targetTxForSignature
                      ? `Ký e-PoD Cho Giao Dịch #${targetTxForSignature.id}`
                      : 'Biên Bản Bàn Giao & Ký Nhận Vỏ Phuy'}
                  </span>
                </h4>
                <p className="text-xs text-slate-500">
                  {targetTxForSignature
                    ? `Xác thực điện tử cho khách: ${targetTxForSignature.customerName}`
                    : 'Xác thực điện tử tại hiện trường giao hàng'}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowSignatureModal(false);
                  setTargetTxForSignature(null);
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Họ và tên người nhận hàng / ký bàn giao:
              </label>
              <input
                type="text"
                value={signedName}
                onChange={(e) => setSignedName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-bold text-slate-900"
              />
            </div>

            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-1">
                <span>Chữ ký số cảm ứng (Vẽ trực tiếp bằng tay/chuột):</span>
                <button
                  type="button"
                  onClick={clearCanvas}
                  className="text-xs text-cyan-700 hover:underline font-semibold cursor-pointer"
                >
                  Vẽ lại
                </button>
              </div>

              {/* HTML5 Canvas Signature Pad */}
              <div className="border-2 border-dashed border-slate-300 rounded-xl bg-slate-50 overflow-hidden relative cursor-crosshair">
                <canvas
                  ref={canvasRef}
                  width={380}
                  height={140}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                  className="w-full h-[140px] touch-none"
                />
                {!hasSignature && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-slate-400 text-xs">
                    Ký tên tại đây
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setShowSignatureModal(false);
                  setTargetTxForSignature(null);
                }}
                className="px-4 py-2 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={() => {
                  const canvas = canvasRef.current;
                  const signatureDataUrl = canvas && hasSignature ? canvas.toDataURL('image/png') : '';
                  if (targetTxForSignature) {
                    setLocalTransactions((prev) =>
                      prev.map((t) =>
                        t.id === targetTxForSignature.id
                          ? { ...t, signature: signatureDataUrl, signedBy: signedName }
                          : t
                      )
                    );
                    if (onSignTransaction) {
                      onSignTransaction(targetTxForSignature.id, signatureDataUrl, signedName);
                    }
                    setTargetTxForSignature(null);
                  } else {
                    setFormSignature({
                      signature: signatureDataUrl,
                      signedBy: signedName,
                    });
                  }
                  soundFX.playSuccess();
                  setShowSignatureModal(false);
                }}
                className="px-5 py-2 rounded-lg bg-cyan-700 hover:bg-cyan-800 text-white text-xs font-bold shadow-xs cursor-pointer"
              >
                Lưu Chữ Ký Vào Biên Bản e-PoD
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Viewing Electronic Proof of Delivery (e-PoD) Modal */}
      {viewingProofTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase tracking-wider mb-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-700" />
                  <span>Chứng Từ Bàn Giao Hợp Pháp (e-PoD)</span>
                </div>
                <h4 className="font-bold text-slate-900 text-base">
                  Biên Bản Giao Nhận &amp; Đối Soát Vỏ Phuy
                </h4>
                <p className="text-xs text-slate-500 font-mono">
                  Mã chứng từ: #{viewingProofTx.id} · Thời gian: {viewingProofTx.timestamp}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setViewingProofTx(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
              <div className="flex justify-between border-b border-slate-200/60 pb-2">
                <span className="text-slate-500">Khách hàng / Garage:</span>
                <span className="font-bold text-slate-900">{viewingProofTx.customerName}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200/60 pb-2">
                <span className="text-slate-500">Số lượng phuy mới giao:</span>
                <span className="font-bold font-mono text-cyan-800">
                  {viewingProofTx.delivered > 0 ? `+${viewingProofTx.delivered} phuy 200L` : '0 phuy'}
                </span>
              </div>
              <div className="flex justify-between border-b border-slate-200/60 pb-2">
                <span className="text-slate-500">Số lượng vỏ rỗng thu hồi:</span>
                <span className="font-bold font-mono text-emerald-800">
                  {viewingProofTx.returned > 0 ? `-${viewingProofTx.returned} vỏ rỗng` : '0 vỏ'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-700 font-bold">Số vỏ khách lưu giữ sau bàn giao:</span>
                <span className="font-mono font-extrabold text-sm text-slate-900">
                  {viewingProofTx.balanceAfter} vỏ
                </span>
              </div>
            </div>

            {/* Signature Proof Card */}
            <div className="p-4 bg-white border-2 border-emerald-300 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800">Chữ ký điện tử người nhận hàng:</span>
                <span className="text-[11px] font-bold text-emerald-700 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Xác thực hiện trường</span>
                </span>
              </div>
              <div className="h-28 w-full bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-center p-2">
                {viewingProofTx.signature ? (
                  <img
                    src={viewingProofTx.signature}
                    alt="Chữ ký e-PoD"
                    className="max-h-full max-w-full object-contain"
                  />
                ) : (
                  <span className="text-xs text-slate-400 italic">Chưa có chữ ký số</span>
                )}
              </div>
              <div className="text-center pt-1">
                <p className="text-xs font-bold text-slate-900">{viewingProofTx.signedBy || 'Người nhận'}</p>
                <p className="text-[10px] text-slate-400 font-mono">{viewingProofTx.timestamp}</p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2 rounded-lg border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>In Chứng Từ e-PoD</span>
              </button>
              <button
                type="button"
                onClick={() => setViewingProofTx(null)}
                className="px-5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
