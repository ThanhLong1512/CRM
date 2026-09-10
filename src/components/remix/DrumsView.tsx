"use client";

import { useState, useRef, useEffect, FormEvent, MouseEvent, TouchEvent, useMemo } from 'react';
import { Customer, DrumTransaction } from '../types';
import { formatVND } from '@/lib/remix/mappers';
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
  Search,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownLeft,
  Check,
  Filter,
  Layers,
  MapPin,
  Phone,
  RefreshCw,
  Sparkles,
  Clock,
  Copy,
} from 'lucide-react';
import { toast } from 'sonner';
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

const DEPOSIT_PRICE_PER_DRUM = 400000; // 400.000đ per steel drum

type CustomerLedgerFilter = 'ALL' | 'HOLDING' | 'URGENT' | 'CLEARED';
type TransactionFilter = 'ALL' | 'DELIVERY' | 'RETURN' | 'SIGNED' | 'UNSIGNED';

export default function DrumsView({
  customers,
  drumTransactions: initialDrumTransactions,
  onUpdateDrumBalance,
  onSignTransaction,
}: DrumsViewProps) {
  const [localTransactions, setLocalTransactions] = useState<DrumTransaction[]>(initialDrumTransactions);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(customers[0]?.id || '');
  const [deliveredCount, setDeliveredCount] = useState<number | ''>('');
  const [returnedCount, setReturnedCount] = useState<number | ''>('');
  const [message, setMessage] = useState<string>('');

  // Sổ kiểm kê tồn vỏ (Customer Drum Ledger) State
  const [ledgerSearch, setLedgerSearch] = useState('');
  const [ledgerFilter, setLedgerFilter] = useState<CustomerLedgerFilter>('ALL');

  // Lịch sử giao dịch (Transaction History) Filter State
  const [txSearch, setTxSearch] = useState('');
  const [txFilter, setTxFilter] = useState<TransactionFilter>('ALL');

  // Digital Signature Modal State
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [signedName, setSignedName] = useState('Trần Minh Đức (Chủ Garage)');
  const [targetTxForSignature, setTargetTxForSignature] = useState<DrumTransaction | null>(null);
  const [viewingProofTx, setViewingProofTx] = useState<DrumTransaction | null>(null);
  const [formSignature, setFormSignature] = useState<{ signature: string; signedBy: string } | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const formRef = useRef<HTMLDivElement | null>(null);
  const [hasSignature, setHasSignature] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);

  // Keep local transactions in sync with prop updates
  useEffect(() => {
    setLocalTransactions(initialDrumTransactions);
  }, [initialDrumTransactions]);

  const activeCustomer = customers.find((c) => c.id === selectedCustomerId);

  // Drums KPI Metrics
  const totalDrumsInMarket = useMemo(
    () => customers.reduce((sum, c) => sum + (c.emptyDrums || 0), 0),
    [customers]
  );
  const customersHoldingDrums = useMemo(
    () => customers.filter((c) => (c.emptyDrums || 0) > 0),
    [customers]
  );
  const urgentCustomers = useMemo(
    () => customers.filter((c) => (c.emptyDrums || 0) >= 10),
    [customers]
  );
  const drumsInTransit = 8; // On return truck
  const totalDepositTiedUp = totalDrumsInMarket * DEPOSIT_PRICE_PER_DRUM;

  // Calculate return efficiency %
  const totalDeliveredEver = useMemo(
    () => localTransactions.reduce((acc, t) => acc + (t.delivered || 0), 0),
    [localTransactions]
  );
  const totalReturnedEver = useMemo(
    () => localTransactions.reduce((acc, t) => acc + (t.returned || 0), 0),
    [localTransactions]
  );
  const returnRatePercent = totalDeliveredEver + totalReturnedEver > 0
    ? Math.min(100, Math.round((totalReturnedEver / Math.max(1, totalDeliveredEver)) * 100))
    : 85;

  // Filtered Customer Ledger
  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      // Filter by tab
      const drums = c.emptyDrums || 0;
      if (ledgerFilter === 'HOLDING' && drums === 0) return false;
      if (ledgerFilter === 'URGENT' && drums < 10) return false;
      if (ledgerFilter === 'CLEARED' && drums > 0) return false;

      // Filter by search
      if (!ledgerSearch.trim()) return true;
      const q = ledgerSearch.toLowerCase().trim();
      return (
        c.name.toLowerCase().includes(q) ||
        (c.code && c.code.toLowerCase().includes(q)) ||
        (c.phone && c.phone.includes(q)) ||
        (c.route && c.route.toLowerCase().includes(q))
      );
    });
  }, [customers, ledgerFilter, ledgerSearch]);

  const {
    currentPage: ledgerPage,
    pageSize: ledgerPageSize,
    totalPages: ledgerTotalPages,
    paginatedItems: paginatedLedgerCustomers,
    startIndex: ledgerStartIndex,
    endIndex: ledgerEndIndex,
    totalItems: ledgerTotalItems,
    goToPage: goToLedgerPage,
    setPageSize: setLedgerPageSize,
  } = usePagination({
    items: filteredCustomers,
    initialPageSize: 6,
    pageSizeOptions: [6, 12, 24],
  });

  const [copiedTxId, setCopiedTxId] = useState<string | null>(null);

  const formatTxCode = (id: string) => {
    if (!id) return '#VP-000';
    if (id.startsWith('DT-')) return id;
    const clean = id.replace(/[^a-zA-Z0-9]/g, '');
    return `#VP-${clean.slice(-6).toUpperCase()}`;
  };

  const handleCopyCode = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedTxId(id);
    soundFX.playClick();
    toast.success(`Đã sao chép mã giao dịch: ${formatTxCode(id)}`);
    setTimeout(() => setCopiedTxId(null), 2000);
  };

  const deliveryTxCount = useMemo(
    () => localTransactions.filter((t) => (t.delivered || 0) > 0).length,
    [localTransactions]
  );
  const returnTxCount = useMemo(
    () => localTransactions.filter((t) => (t.returned || 0) > 0).length,
    [localTransactions]
  );
  const signedTxCount = useMemo(
    () => localTransactions.filter((t) => !!t.signature).length,
    [localTransactions]
  );
  const unsignedTxCount = useMemo(
    () => localTransactions.filter((t) => !t.signature).length,
    [localTransactions]
  );

  // Filtered Transactions
  const filteredTransactions = useMemo(() => {
    return localTransactions.filter((tx) => {
      if (txFilter === 'DELIVERY' && (!tx.delivered || tx.delivered <= 0)) return false;
      if (txFilter === 'RETURN' && (!tx.returned || tx.returned <= 0)) return false;
      if (txFilter === 'SIGNED' && !tx.signature) return false;
      if (txFilter === 'UNSIGNED' && !!tx.signature) return false;

      if (!txSearch.trim()) return true;
      const q = txSearch.toLowerCase().trim();
      const code = formatTxCode(tx.id).toLowerCase();
      return (
        tx.id.toLowerCase().includes(q) ||
        code.includes(q) ||
        tx.customerName.toLowerCase().includes(q) ||
        (tx.signedBy && tx.signedBy.toLowerCase().includes(q))
      );
    });
  }, [localTransactions, txFilter, txSearch]);

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
    items: filteredTransactions,
    initialPageSize: 6,
    pageSizeOptions: [6, 12, 24],
  });

  // Quick Action handlers from ledger row
  const handleQuickRecall = (customer: Customer) => {
    setSelectedCustomerId(customer.id);
    const holding = customer.emptyDrums || 0;
    setDeliveredCount(0);
    setReturnedCount(holding > 0 ? holding : 1);
    setMessage('');
    if (formRef.current) {
      formRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const handleQuickDeliver = (customer: Customer) => {
    setSelectedCustomerId(customer.id);
    setDeliveredCount(1);
    setReturnedCount(0);
    setMessage('');
    if (formRef.current) {
      formRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  // Form Submission
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

    const netChange = delivered - returned;
    const depositDiff = netChange * DEPOSIT_PRICE_PER_DRUM;
    const diffNote =
      depositDiff > 0
        ? ` (Khách cọc thêm: +${formatVND(depositDiff)})`
        : depositDiff < 0
        ? ` (Hoàn cọc cho khách: ${formatVND(depositDiff)})`
        : ' (Cân bằng cọc: 0 đ)';

    setMessage(
      `Đã cập nhật đối soát vỏ phuy cho ${activeCustomer.name}: Giao +${delivered}, Thu -${returned}${diffNote}${
        formSignature ? ' — Đã đính kèm chữ ký e-PoD.' : '.'
      }`
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

  // Real-time calculation helpers for form
  const numDelivered = Number(deliveredCount) || 0;
  const numReturned = Number(returnedCount) || 0;
  const currentCustomerBalance = activeCustomer?.emptyDrums || 0;
  const balanceAfterSimulated = Math.max(0, currentCustomerBalance + numDelivered - numReturned);
  const netDrumChange = numDelivered - numReturned;
  const depositDifferential = netDrumChange * DEPOSIT_PRICE_PER_DRUM;

  return (
    <div id="drums-view" className="w-full space-y-6 pb-12">
      {/* 1. Header Banner */}
      <div className="flex flex-col justify-between gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:flex-row sm:items-center">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
              Quản Lý Vòng Đời &amp; Cấn Trừ Vỏ Phuy Sắt 200L
            </h1>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-300 bg-cyan-100 px-3 py-1 text-xs font-black text-cyan-900 shadow-xs">
              <Boxes className="w-3.5 h-3.5 text-cyan-700" />
              <span>200L Drum Life-Cycle &amp; e-PoD</span>
            </span>
          </div>
          <p className="mt-1 text-xs sm:text-sm text-slate-500 font-medium">
            Kiểm soát tài sản thế chân <strong>400.000 đ / vỏ</strong>, theo dõi chi tiết tồn vỏ tại từng điểm bán, đối soát 2 chiều Giao - Thu và ký biên bản điện tử e-PoD
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            onClick={() => {
              setTargetTxForSignature(null);
              setSignedName(activeCustomer ? `${activeCustomer.name} (Chủ Garage)` : 'Trần Minh Đức (Chủ Garage)');
              clearCanvas();
              setShowSignatureModal(true);
            }}
            className="inline-flex items-center gap-2 rounded-xl bg-cyan-700 hover:bg-cyan-800 px-4 py-2.5 text-xs font-bold text-white shadow-xs transition-colors cursor-pointer"
          >
            <PenTool className="w-4 h-4" />
            <span>Biên Bản Ký e-PoD</span>
          </button>
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 px-3.5 py-2.5 text-xs font-bold text-slate-700 shadow-xs transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4 text-slate-500" />
            <span className="hidden sm:inline">In Sổ Kiểm Kê</span>
          </button>
        </div>
      </div>

      {/* 2. Executive 4 KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: Drums at customer garages */}
        <div className="rounded-2xl border border-amber-200/80 bg-linear-to-br from-white to-amber-50/40 p-4 sm:p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-amber-900">
              Vỏ Tại Khách Hàng
            </span>
            <div className="size-9 rounded-xl bg-amber-100 border border-amber-300 flex items-center justify-center text-base shrink-0 shadow-2xs">
              🛢️
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black font-mono text-amber-950">
              {totalDrumsInMarket} <span className="text-xs sm:text-sm font-bold text-amber-700">vỏ</span>
            </div>
            <p className="mt-1 text-[11px] font-medium text-amber-800 truncate">
              Phân bổ trên {customersHoldingDrums.length} điểm bán &amp; đội xe
            </p>
          </div>
        </div>

        {/* Card 2: Drums in transit */}
        <div className="rounded-2xl border border-cyan-200/80 bg-linear-to-br from-white to-cyan-50/40 p-4 sm:p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-cyan-900">
              Vỏ Đang Trên Xe Về Kho
            </span>
            <div className="size-9 rounded-xl bg-cyan-100 border border-cyan-300 flex items-center justify-center text-base shrink-0 shadow-2xs">
              🚚
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black font-mono text-cyan-950">
              {drumsInTransit} <span className="text-xs sm:text-sm font-bold text-cyan-700">vỏ</span>
            </div>
            <p className="mt-1 text-[11px] font-medium text-cyan-800 truncate">
              Đang trên 2 xe vận tải thu hồi
            </p>
          </div>
        </div>

        {/* Card 3: Deposit Tied Up */}
        <div className="rounded-2xl border border-emerald-200/80 bg-linear-to-br from-white to-emerald-50/40 p-4 sm:p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-emerald-900">
              Tiền Cọc Bảo Lưu
            </span>
            <div className="size-9 rounded-xl bg-emerald-100 border border-emerald-300 flex items-center justify-center text-base shrink-0 shadow-2xs">
              💰
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl sm:text-2xl font-black font-mono text-emerald-950 truncate">
              {formatVND(totalDepositTiedUp)}
            </div>
            <p className="mt-1 text-[11px] font-medium text-emerald-800 truncate">
              Định mức: 400.000 đ / vỏ sắt
            </p>
          </div>
        </div>

        {/* Card 4: Return Rate */}
        <div className="rounded-2xl border border-indigo-200/80 bg-linear-to-br from-white to-indigo-50/40 p-4 sm:p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-indigo-900">
              Tỷ Lệ Thu Hồi Vỏ
            </span>
            <div className="size-9 rounded-xl bg-indigo-100 border border-indigo-300 flex items-center justify-center text-base shrink-0 shadow-2xs">
              🔄
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black font-mono text-indigo-950 flex items-baseline gap-1">
              {returnRatePercent}%
              <span className="text-[10px] font-bold text-indigo-700 uppercase">Hiệu suất cao</span>
            </div>
            <div className="mt-1.5 w-full bg-indigo-100 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-indigo-600 h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${returnRatePercent}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 3. Customer Drum Ledger (Sổ Kiểm Kê Tồn Vỏ Phuy Theo Điểm Bán) */}
      <div className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-cyan-700" />
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                Sổ Kiểm Kê Tồn Vỏ Phuy Theo Điểm Bán / Garage
              </h2>
            </div>
            <p className="mt-0.5 text-xs text-slate-500">
              Tra cứu nhanh khách hàng đang giữ vỏ phuy, tiền cọc bảo lưu và thực hiện thu hồi vỏ chỉ với 1 click
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
              <input
                type="text"
                placeholder="Tìm tên, mã, SĐT, tuyến..."
                value={ledgerSearch}
                onChange={(e) => setLedgerSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-300 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-cyan-600 focus:ring-1 focus:ring-cyan-600"
              />
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setLedgerFilter('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
              ledgerFilter === 'ALL'
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Tất cả ({customers.length})
          </button>
          <button
            onClick={() => setLedgerFilter('HOLDING')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
              ledgerFilter === 'HOLDING'
                ? 'bg-amber-700 text-white shadow-2xs'
                : 'bg-amber-50 text-amber-900 hover:bg-amber-100'
            }`}
          >
            Đang giữ vỏ ({customersHoldingDrums.length})
          </button>
          <button
            onClick={() => setLedgerFilter('URGENT')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
              ledgerFilter === 'URGENT'
                ? 'bg-rose-700 text-white shadow-2xs'
                : 'bg-rose-50 text-rose-900 hover:bg-rose-100'
            }`}
          >
            Cần thu hồi gấp ≥ 10 vỏ ({urgentCustomers.length})
          </button>
          <button
            onClick={() => setLedgerFilter('CLEARED')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
              ledgerFilter === 'CLEARED'
                ? 'bg-emerald-700 text-white shadow-2xs'
                : 'bg-emerald-50 text-emerald-900 hover:bg-emerald-100'
            }`}
          >
            Đã thanh toán hết (= 0 vỏ)
          </button>
        </div>

        {/* Desktop Ledger Table */}
        <div className="hidden md:block overflow-x-auto rounded-2xl border border-slate-200">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/80 text-[11px] font-bold text-slate-600 uppercase border-b border-slate-200">
                <th className="py-2.5 px-3">Điểm Bán / Garage</th>
                <th className="py-2.5 px-2.5 w-32 whitespace-nowrap">Phân Loại &amp; Tuyến</th>
                <th className="py-2.5 px-2 text-center w-24 whitespace-nowrap">Số Vỏ Đang Giữ</th>
                <th className="py-2.5 px-2 text-right w-28 whitespace-nowrap">Tiền Cọc Bảo Lưu</th>
                <th className="py-2.5 px-2 w-32 whitespace-nowrap">Trạng Thái Luân Chuyển</th>
                <th className="py-2.5 px-3 text-right w-40 whitespace-nowrap">Thao Tác Nhanh</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedLedgerCustomers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    Không tìm thấy điểm bán nào phù hợp với bộ lọc.
                  </td>
                </tr>
              ) : (
                paginatedLedgerCustomers.map((c) => {
                  const drums = c.emptyDrums || 0;
                  const deposit = drums * DEPOSIT_PRICE_PER_DRUM;
                  const isSelected = c.id === selectedCustomerId;

                  return (
                    <tr
                      key={c.id}
                      className={`hover:bg-slate-50/90 transition-colors ${
                        isSelected ? 'bg-cyan-50/60 font-semibold' : ''
                      }`}
                    >
                      <td className="py-2.5 px-3">
                        <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                          <span className="truncate max-w-[170px] lg:max-w-[200px]" title={c.name}>{c.name}</span>
                          {c.code && (
                            <span className="font-mono text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded shrink-0">
                              {c.code}
                            </span>
                          )}
                        </div>
                        <div className="text-[10.5px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                          {c.phone && (
                            <span className="flex items-center gap-1 shrink-0">
                              <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                              {c.phone}
                            </span>
                          )}
                          <span className="truncate max-w-[150px] lg:max-w-[180px] text-slate-400" title={c.address}>{c.address}</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-2.5 w-32 whitespace-nowrap">
                        <div className="flex flex-col gap-0.5">
                          <span className="inline-block px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-bold w-fit whitespace-nowrap">
                            {c.type}
                          </span>
                          <span className="text-[10.5px] text-slate-500 flex items-center gap-1" title={c.route}>
                            <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="truncate max-w-[110px]">{c.route || 'Tuyến mặc định'}</span>
                          </span>
                        </div>
                      </td>
                      <td className="py-2.5 px-2 text-center w-24 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-mono font-black text-xs whitespace-nowrap ${
                            drums === 0
                              ? 'bg-slate-100 text-slate-600 border border-slate-200'
                              : drums <= 5
                              ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                              : drums < 10
                              ? 'bg-amber-100 text-amber-950 border border-amber-300'
                              : 'bg-rose-100 text-rose-950 border border-rose-300 animate-pulse'
                          }`}
                        >
                          🛢️ {drums} vỏ
                        </span>
                      </td>
                      <td className="py-2.5 px-2 text-right w-28 whitespace-nowrap font-mono font-bold text-xs text-slate-900">
                        {drums > 0 ? (
                          <span className="text-emerald-800 font-extrabold">{formatVND(deposit)}</span>
                        ) : (
                          <span className="text-slate-400 font-normal">0 đ</span>
                        )}
                      </td>
                      <td className="py-2.5 px-2 w-32 whitespace-nowrap">
                        {drums === 0 ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 whitespace-nowrap">
                            <Check className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>Đã thu hồi hết</span>
                          </span>
                        ) : drums <= 5 ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 whitespace-nowrap">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span>Định mức an toàn</span>
                          </span>
                        ) : drums < 10 ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 whitespace-nowrap">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                            <span>Đến kỳ thu hồi</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-black text-rose-800 whitespace-nowrap">
                            <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                            <span>Quá hạn đối soát</span>
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right w-40 whitespace-nowrap">
                        <div className="inline-flex items-center justify-end gap-1.5 whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => handleQuickRecall(c)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-900 text-[11px] font-bold transition-colors cursor-pointer shadow-2xs whitespace-nowrap shrink-0"
                            title="Nạp khách vào bộ đối soát và điền sẵn số vỏ thu hồi"
                          >
                            <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                            <span className="whitespace-nowrap">Thu vỏ</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleQuickDeliver(c)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-cyan-50 hover:bg-cyan-100 border border-cyan-300 text-cyan-900 text-[11px] font-bold transition-colors cursor-pointer shadow-2xs whitespace-nowrap shrink-0"
                            title="Giao thêm phuy mới"
                          >
                            <ArrowUpRight className="w-3.5 h-3.5 text-cyan-700 shrink-0" />
                            <span className="whitespace-nowrap">Giao mới</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Ledger Cards */}
        <div className="md:hidden space-y-3">
          {paginatedLedgerCustomers.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs">
              Không tìm thấy điểm bán nào phù hợp.
            </div>
          ) : (
            paginatedLedgerCustomers.map((c) => {
              const drums = c.emptyDrums || 0;
              const deposit = drums * DEPOSIT_PRICE_PER_DRUM;
              const isSelected = c.id === selectedCustomerId;

              return (
                <div
                  key={c.id}
                  className={`rounded-2xl border p-3.5 space-y-2.5 transition-colors ${
                    isSelected
                      ? 'border-cyan-400 bg-cyan-50/40 shadow-xs'
                      : 'border-slate-200 bg-white'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                        <span>{c.name}</span>
                        {c.code && (
                          <span className="font-mono text-[9px] text-slate-500 bg-slate-100 px-1 py-0.5 rounded">
                            {c.code}
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{c.address}</div>
                    </div>
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-mono font-black text-xs shrink-0 ${
                        drums === 0
                          ? 'bg-slate-100 text-slate-600'
                          : drums <= 5
                          ? 'bg-emerald-100 text-emerald-900'
                          : drums < 10
                          ? 'bg-amber-100 text-amber-950'
                          : 'bg-rose-100 text-rose-950'
                      }`}
                    >
                      🛢️ {drums} vỏ
                    </span>
                  </div>

                  <div className="flex items-center justify-between rounded-xl bg-slate-50 p-2 text-xs border border-slate-100">
                    <span className="text-[11px] text-slate-500">Tiền cọc thế chân:</span>
                    <span className="font-mono font-bold text-slate-900">
                      {drums > 0 ? formatVND(deposit) : '0 đ'}
                    </span>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => handleQuickDeliver(c)}
                      className="px-2.5 py-1.5 rounded-lg border border-cyan-300 bg-cyan-50 text-cyan-800 text-xs font-bold"
                    >
                      + Giao phuy
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickRecall(c)}
                      className="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-2xs"
                    >
                      ⚡ Thu hồi vỏ
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Ledger Pagination */}
        <div className="pt-2">
          <Pagination
            currentPage={ledgerPage}
            totalPages={ledgerTotalPages}
            pageSize={ledgerPageSize}
            totalItems={ledgerTotalItems}
            startIndex={ledgerStartIndex}
            endIndex={ledgerEndIndex}
            onPageChange={goToLedgerPage}
            onPageSizeChange={setLedgerPageSize}
            pageSizeOptions={[6, 12, 24]}
            compact
          />
        </div>
      </div>

      {/* 4. Main Row: 2-Way Reconciliation Terminal & Live Transaction History */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 4-5 Cols: 2-Way Drum Transaction Form */}
        <div ref={formRef} className="lg:col-span-5 xl:col-span-4 rounded-3xl border border-slate-200 bg-white shadow-sm p-5 sm:p-6 space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <ArrowRightLeft className="w-5 h-5 text-cyan-600" />
              <h3 className="text-base font-bold text-slate-900">
                Đối Soát 2 Chiều Giao Nhận &amp; Cấn Trừ Tiền Cọc
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Nhập số lượng phuy mới giao đi và vỏ rỗng thu hồi về từ điểm bán
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Customer Picker */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Điểm Bán / Garage Đối Tác:
              </label>
              <select
                value={selectedCustomerId}
                onChange={(e) => {
                  setSelectedCustomerId(e.target.value);
                  setMessage('');
                }}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 focus:outline-none focus:border-cyan-600 focus:ring-1 focus:ring-cyan-600 bg-slate-50/50"
              >
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} — (Đang giữ: {c.emptyDrums || 0} vỏ phuy)
                  </option>
                ))}
              </select>
            </div>

            {/* Quick exchange actions */}
            {activeCustomer && (
              <div className="flex flex-wrap items-center gap-1.5 p-2 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                <span className="text-[11px] font-semibold text-slate-500 mr-1">Lối tắt:</span>
                <button
                  type="button"
                  onClick={() => {
                    setDeliveredCount(1);
                    setReturnedCount(1);
                  }}
                  className="px-2 py-1 rounded-lg bg-white border border-slate-200 hover:border-cyan-400 font-bold text-slate-700 text-[11px] cursor-pointer whitespace-nowrap shrink-0"
                >
                  🔄 Đổi 1 - 1
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDeliveredCount(0);
                    setReturnedCount(activeCustomer.emptyDrums || 1);
                  }}
                  className="px-2 py-1 rounded-lg bg-white border border-slate-200 hover:border-emerald-400 font-bold text-emerald-800 text-[11px] cursor-pointer whitespace-nowrap shrink-0"
                >
                  ⚡ Thu hết ({activeCustomer.emptyDrums || 0} vỏ)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDeliveredCount(2);
                    setReturnedCount(0);
                  }}
                  className="px-2 py-1 rounded-lg bg-white border border-slate-200 hover:border-cyan-400 font-bold text-cyan-800 text-[11px] cursor-pointer whitespace-nowrap shrink-0"
                >
                  + Giao 2 phuy
                </button>
              </div>
            )}

            {/* 2-Way Inputs: Delivered vs Returned */}
            <div className="grid grid-cols-2 gap-3 p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200">
              {/* Deliver column */}
              <div>
                <label className="block text-xs font-black text-cyan-950 mb-1">
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
                  className="w-full px-3 py-2 rounded-xl border border-cyan-300 bg-white text-base font-mono font-black text-cyan-900 focus:border-cyan-600 focus:outline-none"
                />
                <div className="flex gap-1 mt-1.5">
                  {[1, 2, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setDeliveredCount((prev) => (Number(prev) || 0) + n)}
                      className="flex-1 py-0.5 rounded bg-cyan-100 hover:bg-cyan-200 text-cyan-900 text-[10px] font-bold"
                    >
                      +{n}
                    </button>
                  ))}
                </div>
              </div>

              {/* Return column */}
              <div>
                <label className="block text-xs font-black text-emerald-950 mb-1">
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
                  className="w-full px-3 py-2 rounded-xl border border-emerald-300 bg-white text-base font-mono font-black text-emerald-900 focus:border-emerald-600 focus:outline-none"
                />
                <div className="flex gap-1 mt-1.5">
                  {[1, 2, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setReturnedCount((prev) => (Number(prev) || 0) + n)}
                      className="flex-1 py-0.5 rounded bg-emerald-100 hover:bg-emerald-200 text-emerald-900 text-[10px] font-bold"
                    >
                      +{n}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Real-time Deposit Differential Calculator (Cấn Trừ Tiền Cọc Trực Tiếp) */}
            {activeCustomer && (
              <div className="p-3.5 bg-linear-to-br from-slate-50 to-slate-100 border border-slate-200 rounded-2xl text-xs space-y-2">
                <div className="flex justify-between items-center text-slate-700">
                  <span className="font-medium">Số vỏ nợ trước giao dịch:</span>
                  <span className="font-mono font-bold text-slate-900">
                    {currentCustomerBalance} vỏ ({formatVND(currentCustomerBalance * DEPOSIT_PRICE_PER_DRUM)})
                  </span>
                </div>
                <div className="flex justify-between items-center text-slate-700">
                  <span className="font-medium">Số vỏ sau khi đối soát:</span>
                  <span className="font-mono font-black text-sm text-slate-900">
                    {balanceAfterSimulated} vỏ ({formatVND(balanceAfterSimulated * DEPOSIT_PRICE_PER_DRUM)})
                  </span>
                </div>

                {/* Net Deposit Impact Banner */}
                <div
                  className={`p-2.5 rounded-xl border flex items-center justify-between font-bold ${
                    depositDifferential > 0
                      ? 'bg-amber-100 border-amber-300 text-amber-950'
                      : depositDifferential < 0
                      ? 'bg-emerald-100 border-emerald-300 text-emerald-950'
                      : 'bg-slate-200/70 border-slate-300 text-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    {depositDifferential > 0 ? (
                      <ArrowUpRight className="w-4 h-4 text-amber-800" />
                    ) : depositDifferential < 0 ? (
                      <ArrowDownLeft className="w-4 h-4 text-emerald-800" />
                    ) : (
                      <RotateCcw className="w-4 h-4 text-slate-600" />
                    )}
                    <span>
                      {depositDifferential > 0
                        ? 'Khách nộp thêm tiền cọc:'
                        : depositDifferential < 0
                        ? 'Đại lý hoàn trả cọc:'
                        : 'Đổi ngang (Cân bằng cọc):'}
                    </span>
                  </div>
                  <span className="font-mono text-sm">
                    {depositDifferential > 0
                      ? `+${formatVND(depositDifferential)}`
                      : depositDifferential < 0
                      ? `-${formatVND(Math.abs(depositDifferential))}`
                      : '0 đ'}
                  </span>
                </div>
              </div>
            )}

            {/* e-PoD Digital Signature trigger on form */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
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
                <div className="flex items-center gap-2.5 p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl">
                  <div className="h-10 w-28 bg-white border border-emerald-300 rounded overflow-hidden flex items-center justify-center p-0.5 shrink-0 shadow-2xs">
                    <img src={formSignature.signature} alt="Chữ ký" className="max-h-full max-w-full object-contain" />
                  </div>
                  <div className="text-[11px] min-w-0 flex-1">
                    <p className="font-bold text-emerald-900 truncate">✓ Đã ký: {formSignature.signedBy}</p>
                    <p className="text-[10px] text-emerald-700 font-medium">Bằng chứng e-PoD hợp pháp</p>
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
                  className="w-full py-2.5 px-3 border border-dashed border-cyan-400 bg-cyan-50/50 hover:bg-cyan-50 rounded-xl text-xs font-bold text-cyan-800 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <PenTool className="w-3.5 h-3.5 text-cyan-700" />
                  <span>Ký nhận bàn giao vỏ tại chỗ (Touch Pad)</span>
                </button>
              )}
            </div>

            {message && (
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{message}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 rounded-2xl bg-cyan-700 hover:bg-cyan-800 text-white font-black text-xs shadow-md transition-colors cursor-pointer"
            >
              Cập Nhật Biên Bản Đối Soát Vỏ &amp; Lưu e-PoD
            </button>
          </form>
        </div>

        {/* Right 7-8 Cols: Realtime Drum Transactions Log */}
        <div className="lg:col-span-7 xl:col-span-8 rounded-3xl border border-slate-200 bg-white shadow-sm p-4 sm:p-5 flex flex-col justify-between space-y-4">
          <div>
            {/* Header with Title & Search */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
              <div className="flex items-center gap-2.5">
                <div className="size-9 rounded-xl bg-cyan-100 border border-cyan-300 text-cyan-900 flex items-center justify-center shrink-0 shadow-2xs">
                  <History className="w-5 h-5 text-cyan-700" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 leading-tight">
                    Nhật Ký Luân Chuyển Vỏ Phuy Sắt 200L
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Lịch sử các lượt giao nhận, cấn trừ tiền cọc và chữ ký số xác thực e-PoD
                  </p>
                </div>
              </div>

              {/* Transaction Search */}
              <div className="relative w-full sm:w-56">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Mã GD, tên khách, người ký..."
                  value={txSearch}
                  onChange={(e) => setTxSearch(e.target.value)}
                  className="w-full pl-8.5 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-cyan-600 focus:ring-1 focus:ring-cyan-600 bg-slate-50/50"
                />
              </div>
            </div>

            {/* Filter Tabs for Transactions */}
            <div className="flex flex-wrap items-center justify-between gap-2 my-3.5">
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  onClick={() => setTxFilter('ALL')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                    txFilter === 'ALL'
                      ? 'bg-slate-900 text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Tất cả ({localTransactions.length})
                </button>
                <button
                  onClick={() => setTxFilter('DELIVERY')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                    txFilter === 'DELIVERY'
                      ? 'bg-cyan-700 text-white shadow-2xs'
                      : 'bg-cyan-50 text-cyan-900 hover:bg-cyan-100'
                  }`}
                >
                  Giao mới (+{deliveryTxCount})
                </button>
                <button
                  onClick={() => setTxFilter('RETURN')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                    txFilter === 'RETURN'
                      ? 'bg-emerald-700 text-white shadow-2xs'
                      : 'bg-emerald-50 text-emerald-900 hover:bg-emerald-100'
                  }`}
                >
                  Thu hồi (-{returnTxCount})
                </button>
                <button
                  onClick={() => setTxFilter('SIGNED')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                    txFilter === 'SIGNED'
                      ? 'bg-purple-700 text-white shadow-2xs'
                      : 'bg-purple-50 text-purple-900 hover:bg-purple-100'
                  }`}
                >
                  Đã ký e-PoD ({signedTxCount})
                </button>
                <button
                  onClick={() => setTxFilter('UNSIGNED')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                    txFilter === 'UNSIGNED'
                      ? 'bg-amber-600 text-white shadow-2xs'
                      : 'bg-amber-50 text-amber-900 hover:bg-amber-100'
                  }`}
                >
                  Chưa ký ({unsignedTxCount})
                </button>
              </div>

              <div className="hidden xl:block text-[11px] font-medium text-slate-400">
                Hiển thị {paginatedTransactions.length} / {filteredTransactions.length} giao dịch
              </div>
            </div>

            {/* Mobile Transactions Cards */}
            <div className="md:hidden space-y-3">
              {paginatedTransactions.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs">
                  Không tìm thấy giao dịch nào phù hợp.
                </div>
              ) : (
                paginatedTransactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="rounded-2xl border border-slate-200 bg-white p-3.5 space-y-2.5 shadow-2xs"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleCopyCode(tx.id)}
                          className="font-mono font-bold text-xs text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md flex items-center gap-1"
                        >
                          <span>{formatTxCode(tx.id)}</span>
                          {copiedTxId === tx.id ? (
                            <Check className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <Copy className="w-3 h-3 text-slate-400" />
                          )}
                        </button>
                        <span className="text-[10px] text-slate-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {tx.timestamp}
                        </span>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${
                          tx.balanceAfter === 0
                            ? 'bg-slate-100 text-slate-600'
                            : 'bg-amber-100 text-amber-950'
                        }`}
                      >
                        Tồn: {tx.balanceAfter} vỏ
                      </span>
                    </div>

                    <div className="font-bold text-slate-900 text-xs">
                      {tx.customerName}
                    </div>

                    <div className="flex items-center justify-between rounded-xl bg-slate-50 p-2 border border-slate-100 text-xs">
                      <div className="flex items-center gap-2">
                        {tx.delivered > 0 && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-cyan-50 border border-cyan-200 text-cyan-900 font-bold text-xs">
                            <ArrowUpRight className="w-3 h-3 text-cyan-700" />
                            +{tx.delivered} Giao
                          </span>
                        )}
                        {tx.returned > 0 && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-900 font-bold text-xs">
                            <ArrowDownLeft className="w-3 h-3 text-emerald-700" />
                            -{tx.returned} Thu
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-500 font-medium">
                        Cọc: {formatVND(tx.balanceAfter * DEPOSIT_PRICE_PER_DRUM)}
                      </span>
                    </div>

                    <div className="pt-1 flex items-center justify-end">
                      {tx.signature ? (
                        <div className="flex items-center justify-between w-full">
                          <span className="inline-flex items-center gap-1 text-emerald-800 text-[11px] font-bold">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            {tx.signedBy || 'Đã ký e-PoD'}
                          </span>
                          <button
                            type="button"
                            onClick={() => setViewingProofTx(tx)}
                            className="text-xs font-bold text-cyan-700 hover:underline"
                          >
                            Xem chứng từ →
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
                          className="w-full inline-flex items-center justify-center gap-1.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold shadow-xs cursor-pointer"
                        >
                          <PenTool className="w-3.5 h-3.5" />
                          <span>Ký nhận e-PoD</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Desktop Transactions Table */}
            <div className="hidden md:block overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50/80 text-[11px] font-bold text-slate-600 uppercase border-b border-slate-200">
                    <th className="py-2.5 px-2.5 whitespace-nowrap">Mã GD &amp; Giờ</th>
                    <th className="py-2.5 px-2">Điểm Bán / Garage</th>
                    <th className="py-2.5 px-1.5 text-center whitespace-nowrap">Giao (+)</th>
                    <th className="py-2.5 px-1.5 text-center whitespace-nowrap">Thu (-)</th>
                    <th className="py-2.5 px-1.5 text-center whitespace-nowrap">Tồn Sau</th>
                    <th className="py-2.5 px-2.5 text-right whitespace-nowrap">Ký Nhận e-PoD</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">
                        Không tìm thấy giao dịch nào phù hợp với bộ lọc.
                      </td>
                    </tr>
                  ) : (
                    paginatedTransactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-cyan-50/20 transition-colors">
                        <td className="py-2 px-2.5 whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => handleCopyCode(tx.id)}
                            className="group inline-flex items-center gap-1 font-mono font-bold text-[10.5px] text-slate-800 bg-slate-100 hover:bg-cyan-50 hover:text-cyan-900 px-1.5 py-0.5 rounded-md transition cursor-pointer whitespace-nowrap"
                            title={`Bấm để sao chép: ${tx.id}`}
                          >
                            <span>{formatTxCode(tx.id)}</span>
                            {copiedTxId === tx.id ? (
                              <Check className="w-3 h-3 text-emerald-600 shrink-0" />
                            ) : (
                              <Copy className="w-3 h-3 text-slate-400 group-hover:text-cyan-700 shrink-0" />
                            )}
                          </button>
                          <div className="flex items-center gap-1 text-[9.5px] text-slate-400 mt-0.5 font-medium whitespace-nowrap">
                            <Clock className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                            <span>{tx.timestamp}</span>
                          </div>
                        </td>
                        <td className="py-2 px-2">
                          <div className="font-bold text-slate-900 text-xs truncate max-w-[120px] lg:max-w-[140px] xl:max-w-[170px]" title={tx.customerName}>
                            {tx.customerName}
                          </div>
                          <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                            <Building2 className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                            <span className="truncate max-w-[110px] lg:max-w-[130px]">
                              {customers.find((c) => c.id === tx.customerId)?.type || 'Điểm bán B2B'}
                            </span>
                          </div>
                        </td>
                        <td className="py-2 px-1.5 text-center whitespace-nowrap">
                          {tx.delivered > 0 ? (
                            <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-lg bg-cyan-50 border border-cyan-200 text-cyan-900 font-bold text-[11px]">
                              <ArrowUpRight className="w-3 h-3 text-cyan-700 shrink-0" />
                              +{tx.delivered} phuy
                            </span>
                          ) : (
                            <span className="text-slate-300 font-bold text-sm">—</span>
                          )}
                        </td>
                        <td className="py-2 px-1.5 text-center whitespace-nowrap">
                          {tx.returned > 0 ? (
                            <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 font-bold text-[11px]">
                              <ArrowDownLeft className="w-3 h-3 text-emerald-700 shrink-0" />
                              -{tx.returned} vỏ
                            </span>
                          ) : (
                            <span className="text-slate-300 font-bold text-sm">—</span>
                          )}
                        </td>
                        <td className="py-2 px-1.5 text-center whitespace-nowrap">
                          <div className="inline-flex flex-col items-center">
                            <span
                              className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${
                                tx.balanceAfter === 0
                                  ? 'bg-slate-100 text-slate-600'
                                  : 'bg-amber-100/80 text-amber-950 border border-amber-200/60'
                              }`}
                            >
                              {tx.balanceAfter} vỏ
                            </span>
                            <span className="text-[9.5px] text-slate-400 font-medium mt-0.5">
                              {tx.balanceAfter > 0 ? formatVND(tx.balanceAfter * DEPOSIT_PRICE_PER_DRUM) : '0 đ'}
                            </span>
                          </div>
                        </td>
                        <td className="py-2 px-2.5 text-right whitespace-nowrap">
                          {tx.signature ? (
                            <div className="flex flex-col items-end gap-0.5">
                              <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 text-[10px] font-bold">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                                <span className="truncate max-w-[85px]">{tx.signedBy || 'Đã ký'}</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => setViewingProofTx(tx)}
                                className="text-[10px] font-bold text-cyan-700 hover:text-cyan-900 hover:underline cursor-pointer"
                              >
                                Xem chứng từ →
                              </button>
                            </div>
                          ) : (
                            <div className="flex justify-end">
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
                                className="inline-flex items-center gap-1 px-2 py-1 rounded-xl bg-cyan-700 hover:bg-cyan-800 text-white text-[11px] font-bold shadow-xs whitespace-nowrap cursor-pointer transition-colors"
                              >
                                <PenTool className="w-3 h-3" />
                                <span>Ký nhận e-PoD</span>
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100">
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

      {/* 5. Digital Signature Pad Modal */}
      {showSignatureModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
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
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
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
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 focus:outline-none focus:border-cyan-600"
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
              <div className="border-2 border-dashed border-slate-300 rounded-2xl bg-slate-50 overflow-hidden relative cursor-crosshair">
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
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-slate-400 text-xs font-medium">
                    ✍️ Ký tên hoặc điểm chỉ tại đây
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
                className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Hủy bỏ
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
                className="px-5 py-2 rounded-xl bg-cyan-700 hover:bg-cyan-800 text-white text-xs font-bold shadow-md cursor-pointer"
              >
                Lưu Chữ Ký Vào Biên Bản e-PoD
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. Viewing Electronic Proof of Delivery (e-PoD) Modal */}
      {viewingProofTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-900 text-[10px] font-black uppercase tracking-wider mb-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Chứng Từ Bàn Giao Hợp Pháp (e-PoD)</span>
                </div>
                <h4 className="font-black text-slate-900 text-base">
                  Biên Bản Giao Nhận &amp; Đối Soát Vỏ Phuy
                </h4>
                <p className="text-xs text-slate-500 font-mono">
                  Mã chứng từ: #{viewingProofTx.id} · {viewingProofTx.timestamp}
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

            <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs">
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
              <div className="flex justify-between border-b border-slate-200/60 pb-2">
                <span className="text-slate-500">Biến động cọc thế chân:</span>
                <span className="font-mono font-bold text-slate-900">
                  {(() => {
                    const diff = ((viewingProofTx.delivered || 0) - (viewingProofTx.returned || 0)) * DEPOSIT_PRICE_PER_DRUM;
                    if (diff > 0) return `Khách cọc thêm: +${formatVND(diff)}`;
                    if (diff < 0) return `Hoàn cọc cho khách: -${formatVND(Math.abs(diff))}`;
                    return 'Cân bằng cọc (0 đ)';
                  })()}
                </span>
              </div>
              <div className="flex justify-between pt-1">
                <span className="text-slate-700 font-bold">Số vỏ khách lưu giữ sau bàn giao:</span>
                <span className="font-mono font-black text-sm text-slate-900">
                  {viewingProofTx.balanceAfter} vỏ
                </span>
              </div>
            </div>

            {/* Signature Proof Card */}
            <div className="p-4 bg-white border-2 border-emerald-300 rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800">Chữ ký điện tử người nhận hàng:</span>
                <span className="text-[11px] font-bold text-emerald-700 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Xác thực hiện trường</span>
                </span>
              </div>
              <div className="h-28 w-full bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-center p-2">
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
                className="px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>In Biên Bản e-PoD</span>
              </button>
              <button
                type="button"
                onClick={() => setViewingProofTx(null)}
                className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold cursor-pointer"
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
