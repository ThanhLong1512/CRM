import { useState, useRef, FormEvent, MouseEvent, TouchEvent } from 'react';
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

interface DrumsViewProps {
  customers: Customer[];
  drumTransactions: DrumTransaction[];
  onUpdateDrumBalance: (
    customerId: string,
    delivered: number,
    returned: number
  ) => void;
}

export default function DrumsView({
  customers,
  drumTransactions,
  onUpdateDrumBalance,
}: DrumsViewProps) {
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(
    customers[0]?.id || ''
  );
  const [deliveredCount, setDeliveredCount] = useState<number | ''>('');
  const [returnedCount, setReturnedCount] = useState<number | ''>('');
  const [message, setMessage] = useState<string>('');

  // Digital Signature Modal State
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [signedName, setSignedName] = useState('Trần Minh Đức (Chủ Garage)');
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

    onUpdateDrumBalance(activeCustomer.id, delivered, returned);
    soundFX.playSuccess();
    setMessage(
      `Đã cập nhật vỏ phuy 200L cho ${activeCustomer.name}: Giao +${delivered}, Thu -${returned}.`
    );

    setDeliveredCount('');
    setReturnedCount('');
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
    <div id="drums-view" className="p-6 max-w-7xl mx-auto space-y-6">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">
              Quản Lý &amp; Cấn Trừ Vòng Đời Vỏ Phuy Sắt 200L
            </h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-100 text-cyan-900 font-bold border border-cyan-300">
              200L Drum Asset Tracking
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Kiểm soát tài sản thế chân 400.000đ/vỏ, đối soát 2 chiều Giao mới - Thu hồi và ký biên bản điện tử
          </p>
        </div>

        <button
          onClick={() => setShowSignatureModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs shadow-xs cursor-pointer"
        >
          <PenTool className="w-4 h-4" />
          <span>Biên Bản Ký Nhận Vỏ</span>
        </button>
      </div>

      {/* 2. Top Drum Ledger Balance Cards (Bảng Cân Bằng Vỏ Phuy) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Drums at customer garages */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500 font-medium">
              Vỏ Đang Nằm Tại Khách Hàng (Thị Trường)
            </div>
            <div className="mt-2 text-3xl font-black font-mono text-amber-700">
              {totalDrumsInMarket} <span className="text-sm font-semibold text-slate-500">vỏ</span>
            </div>
            <div className="text-[11px] text-amber-700 font-medium mt-1">
              Phân bổ trên {customers.filter((c) => (c.emptyDrums || 0) > 0).length} điểm bán &amp; đội xe
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center text-xl">
            🛢️
          </div>
        </div>

        {/* Card 2: Drums in transit */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500 font-medium">
              Vỏ Đang Trên Xe Vận Chuyển Về Kho
            </div>
            <div className="mt-2 text-3xl font-black font-mono text-cyan-800">
              {drumsInTransit} <span className="text-sm font-semibold text-slate-500">vỏ</span>
            </div>
            <div className="text-[11px] text-cyan-700 font-medium mt-1">
              Đang trên 2 xe tải giao vận của công ty
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-cyan-100 text-cyan-800 flex items-center justify-center text-xl">
            🚚
          </div>
        </div>

        {/* Card 3: Total Deposit Money tied up */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500 font-medium">
              Tổng Giá Trị Tiền Cọc Đang Treo
            </div>
            <div className="mt-2 text-2xl font-black font-mono text-emerald-800">
              {formatVND(totalDepositTiedUp)}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Định mức thế chân: <strong>400.000 đ / vỏ</strong>
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center text-xl">
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
                  Nhật ký chi tiết các lượt giao nhận và chữ ký người bàn giao
                </p>
              </div>
            </div>

            {/* Transactions Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase border-b border-slate-200">
                    <th className="py-2.5 px-3">Mã GD</th>
                    <th className="py-2.5 px-3">Điểm Bán / Garage</th>
                    <th className="py-2.5 px-3 text-cyan-800">Giao (+)</th>
                    <th className="py-2.5 px-3 text-emerald-800">Thu (-)</th>
                    <th className="py-2.5 px-3">Tồn Vỏ Sau GD</th>
                    <th className="py-2.5 px-3">Người Nhận / Ký</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {drumTransactions.map((tx) => (
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
                        <div className="flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>{tx.signedBy || 'Ký nhận điện tử'}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">{tx.timestamp}</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
                  <span>Biên Bản Bàn Giao &amp; Ký Nhận Vỏ Phuy</span>
                </h4>
                <p className="text-xs text-slate-500">Xác thực điện tử tại hiện trường giao hàng</p>
              </div>
              <button onClick={() => setShowSignatureModal(false)} className="text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Họ và tên người nhận hàng:
              </label>
              <input
                type="text"
                value={signedName}
                onChange={(e) => setSignedName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-bold"
              />
            </div>

            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-1">
                <span>Chữ ký số cảm ứng (Vẽ trực tiếp bằng tay/chuột):</span>
                <button
                  onClick={clearCanvas}
                  className="text-xs text-cyan-700 hover:underline font-semibold"
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
                onClick={() => setShowSignatureModal(false)}
                className="px-4 py-2 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Đóng
              </button>
              <button
                onClick={() => {
                  soundFX.playSuccess();
                  setShowSignatureModal(false);
                }}
                className="px-5 py-2 rounded-lg bg-cyan-700 hover:bg-cyan-800 text-white text-xs font-bold shadow-xs"
              >
                Lưu Chữ Ký Vào Biên Bản
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
