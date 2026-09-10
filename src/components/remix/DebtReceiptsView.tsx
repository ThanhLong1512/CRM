"use client";

import { useCallback, useEffect, useState, useTransition, useMemo, useRef } from "react";
import { toast } from "sonner";
import {
  approveDebtPayment,
  cancelDebtPayment,
  createDebtPayment,
  listDebtPayments,
  type DebtPaymentListItem,
} from "@/app/(private)/khach-hang/debt-actions";
import { formatVND } from "@/lib/remix/mappers";
import { exportDebtPaymentsReport } from "@/lib/exportUtils";
import type { AuthUserProfile } from "@/components/auth/authData";
import type { Customer, DebtPaymentStatus } from "@/types";
import {
  Receipt,
  CheckCircle2,
  XCircle,
  Filter,
  RefreshCw,
  Banknote,
  CreditCard,
  Search,
  Download,
  Plus,
  Printer,
  Calendar,
  DollarSign,
  Clock,
  Check,
  AlertTriangle,
  FileText,
  Building2,
  User,
  X,
  Eye,
} from "lucide-react";

type DebtReceiptsViewProps = {
  sessionUser?: AuthUserProfile | null;
  customers?: Customer[];
};

const STATUS_FILTERS: Array<{ value: DebtPaymentStatus | "ALL"; label: string }> = [
  { value: "ALL", label: "Tất cả" },
  { value: "PENDING", label: "Chờ duyệt" },
  { value: "APPROVED", label: "Đã duyệt" },
  { value: "CANCELLED", label: "Đã hủy" },
];

/** Hàm đọc số tiền thành chữ tiếng Việt */
function numberToVietnameseWords(num: number): string {
  if (!num || isNaN(num) || num <= 0) return "Không đồng";
  const units = ["", "nghìn", "triệu", "tỷ", "nghìn tỷ", "triệu tỷ"];
  const digits = ["không", "một", "hai", "ba", "bốn", "năm", "sáu", "bảy", "tám", "chín"];

  function readThreeDigits(n: number, showZeroHundred: boolean): string {
    const h = Math.floor(n / 100);
    const t = Math.floor((n % 100) / 10);
    const d = n % 10;
    let res = "";

    if (h > 0 || showZeroHundred) {
      res += digits[h] + " trăm ";
    }

    if (t === 0 && d > 0 && (h > 0 || showZeroHundred)) {
      res += "lẻ ";
    } else if (t === 1) {
      res += "mười ";
    } else if (t > 1) {
      res += digits[t] + " mươi ";
    }

    if (t > 0 && d === 1) {
      res += "mốt";
    } else if (t > 0 && d === 5) {
      res += "lăm";
    } else if (d > 0) {
      res += digits[d];
    }

    return res.trim();
  }

  let s = "";
  let unitIndex = 0;
  let remaining = Math.round(num);

  while (remaining > 0) {
    const chunk = remaining % 1000;
    if (chunk > 0) {
      const showZeroHundred = remaining >= 1000;
      const chunkStr = readThreeDigits(chunk, showZeroHundred);
      s = chunkStr + " " + units[unitIndex] + " " + s;
    }
    remaining = Math.floor(remaining / 1000);
    unitIndex++;
  }

  s = s.trim();
  if (!s) return "Không đồng";
  // Viết hoa chữ cái đầu và thêm từ "đồng"
  return s.charAt(0).toUpperCase() + s.slice(1) + " đồng chẵn.";
}

export default function DebtReceiptsView({
  sessionUser = null,
  customers = [],
}: DebtReceiptsViewProps) {
  const role = sessionUser?.role ?? "sales";
  const canApprove = role === "director" || role === "accountant";
  const userId = sessionUser?.id;

  // Filter state
  const [statusFilter, setStatusFilter] = useState<DebtPaymentStatus | "ALL">("PENDING");
  const [methodFilter, setMethodFilter] = useState<"ALL" | "CASH" | "BANK_TRANSFER">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [dateRange, setDateRange] = useState<"ALL" | "TODAY" | "7DAYS" | "30DAYS">("ALL");

  // Data & loading
  const [items, setItems] = useState<DebtPaymentListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [pending, startTransition] = useTransition();

  // Modals state
  const [cancellingItem, setCancellingItem] = useState<DebtPaymentListItem | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [viewingReceipt, setViewingReceipt] = useState<DebtPaymentListItem | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Form create state
  const [createCustomerId, setCreateCustomerId] = useState("");
  const [createAmount, setCreateAmount] = useState("");
  const [createMethod, setCreateMethod] = useState<"CASH" | "BANK_TRANSFER">("BANK_TRANSFER");
  const [createNotes, setCreateNotes] = useState("");
  const [isSubmittingCreate, setIsSubmittingCreate] = useState(false);

  // Printable receipt ref
  const printReceiptRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const list = await listDebtPayments({
        status: statusFilter,
        limit: 200,
      });
      setItems(list);
    } catch {
      toast.error("Không tải được sổ phiếu thu.");
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  // Handle Approve
  const handleApprove = (id: string) => {
    startTransition(async () => {
      const res = await approveDebtPayment(id);
      if (!res.success) {
        toast.error(res.error ?? res.message);
        return;
      }
      toast.success(res.message);
      await load();
    });
  };

  // Handle Cancel
  const handleConfirmCancel = () => {
    if (!cancellingItem) return;
    startTransition(async () => {
      const res = await cancelDebtPayment(
        cancellingItem.id,
        cancelReason || undefined
      );
      if (!res.success) {
        toast.error(res.error ?? res.message);
        return;
      }
      toast.success(res.message);
      setCancellingItem(null);
      setCancelReason("");
      await load();
    });
  };

  // Handle Create Debt Payment
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createCustomerId) {
      toast.error("Vui lòng chọn khách hàng.");
      return;
    }
    const numAmount = Number(createAmount.replace(/[^0-9]/g, ""));
    if (!numAmount || numAmount <= 0) {
      toast.error("Vui lòng nhập số tiền hợp lệ lớn hơn 0.");
      return;
    }

    setIsSubmittingCreate(true);
    try {
      const res = await createDebtPayment({
        customerId: createCustomerId,
        amount: numAmount,
        method: createMethod,
        notes: createNotes.trim() || undefined,
      });

      if (!res.success) {
        toast.error(res.error ?? res.message);
        return;
      }

      toast.success(res.message);
      setShowCreateModal(false);
      setCreateCustomerId("");
      setCreateAmount("");
      setCreateNotes("");
      await load();
    } catch (err) {
      console.error(err);
      toast.error("Đã xảy ra lỗi khi tạo phiếu thu.");
    } finally {
      setIsSubmittingCreate(false);
    }
  };

  // Handle Print
  const handlePrint = () => {
    window.print();
  };

  // Handle Export CSV
  const handleExport = () => {
    if (filteredItems.length === 0) {
      toast.error("Không có dữ liệu phiếu thu để xuất.");
      return;
    }
    exportDebtPaymentsReport(filteredItems);
    toast.success(`Đã xuất ${filteredItems.length} phiếu thu ra file Excel.`);
  };

  // Filtered Items logic
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // 1. Method filter
      if (methodFilter !== "ALL" && item.method !== methodFilter) {
        return false;
      }

      // 2. Date Range filter
      if (dateRange !== "ALL") {
        const itemDate = new Date(item.createdAt).getTime();
        const now = Date.now();
        if (dateRange === "TODAY") {
          const startOfToday = new Date().setHours(0, 0, 0, 0);
          if (itemDate < startOfToday) return false;
        } else if (dateRange === "7DAYS") {
          const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
          if (itemDate < sevenDaysAgo) return false;
        } else if (dateRange === "30DAYS") {
          const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
          if (itemDate < thirtyDaysAgo) return false;
        }
      }

      // 3. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchReceipt = item.receiptNumber.toLowerCase().includes(q);
        const matchCustomer = (item.customerName || item.customerId).toLowerCase().includes(q);
        const matchUser = (item.userName || "").toLowerCase().includes(q);
        const matchNotes = (item.notes || "").toLowerCase().includes(q);
        if (!matchReceipt && !matchCustomer && !matchUser && !matchNotes) {
          return false;
        }
      }

      return true;
    });
  }, [items, methodFilter, dateRange, searchQuery]);

  // Statistics calculation
  const stats = useMemo(() => {
    const totalCount = items.length;
    const pendingList = items.filter((i) => i.status === "PENDING");
    const approvedList = items.filter((i) => i.status === "APPROVED");
    const cancelledList = items.filter((i) => i.status === "CANCELLED");

    const pendingTotal = pendingList.reduce((sum, i) => sum + i.amount, 0);
    const approvedTotal = approvedList.reduce((sum, i) => sum + i.amount, 0);

    const cashTotal = items
      .filter((i) => i.method === "CASH" && i.status !== "CANCELLED")
      .reduce((sum, i) => sum + i.amount, 0);
    const bankTotal = items
      .filter((i) => i.method === "BANK_TRANSFER" && i.status !== "CANCELLED")
      .reduce((sum, i) => sum + i.amount, 0);

    return {
      totalCount,
      pendingCount: pendingList.length,
      pendingTotal,
      approvedCount: approvedList.length,
      approvedTotal,
      cancelledCount: cancelledList.length,
      cashTotal,
      bankTotal,
    };
  }, [items]);

  const indebtedCustomers = useMemo(() => {
    return customers
      .filter((c) => (c.currentDebt || 0) > 0)
      .sort((a, b) => (b.currentDebt || 0) - (a.currentDebt || 0));
  }, [customers]);

  const selectedCustomerInfo = useMemo(() => {
    return customers.find((c) => c.id === createCustomerId);
  }, [customers, createCustomerId]);

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-300">
      {/* ── 1. Page Header & Actions Bar ─────────────────── */}
      <div className="flex flex-col gap-4 rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-gradient-to-br from-white via-white to-slate-50/60 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800/40 p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/20 ring-4 ring-emerald-500/10">
            <Receipt className="h-7 w-7" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100">
                Sổ Phiếu Thu Nợ
              </h1>
              <span className="rounded-full bg-emerald-100 dark:bg-emerald-950/60 px-2.5 py-0.5 text-xs font-bold text-emerald-800 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60">
                Kế toán & Tài chính
              </span>
            </div>
            <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Quản lý, đối soát và phê duyệt các khoản thu tiền mặt & chuyển khoản từ khách hàng.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:self-center">
          {/* Nút Tạo phiếu thu mới */}
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-emerald-600/20 hover:from-emerald-500 hover:to-teal-500 active:scale-95 transition-all"
          >
            <Plus className="h-4 w-4" />
            + Lập phiếu thu
          </button>

          {/* Nút Xuất Excel */}
          <button
            type="button"
            onClick={handleExport}
            disabled={filteredItems.length === 0}
            title="Xuất danh sách ra file Excel / CSV"
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/80 active:scale-95 disabled:opacity-40 transition-all"
          >
            <Download className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
            Xuất Excel
          </button>

          {/* Nút Làm mới */}
          <button
            type="button"
            onClick={() => void load()}
            disabled={loading || pending}
            title="Tải lại dữ liệu"
            className="inline-flex cursor-pointer items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/80 active:scale-95 disabled:opacity-40 transition-all"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin text-emerald-600" : ""}`} />
          </button>
        </div>
      </div>

      {/* ── 2. Stat / KPI Summary Cards ──────────────────── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Tiền đã duyệt */}
        <div className="relative overflow-hidden rounded-2xl border border-emerald-200/80 dark:border-emerald-900/50 bg-gradient-to-br from-emerald-50/60 via-white to-white dark:from-emerald-950/20 dark:via-slate-900 dark:to-slate-900 p-5 shadow-xs transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-800 dark:text-emerald-400">
              ĐÃ DUYỆT THỰC THU
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 font-mono text-2xl font-black text-slate-900 dark:text-slate-100">
            {formatVND(stats.approvedTotal)}
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            <span className="font-bold text-emerald-600 dark:text-emerald-400">{stats.approvedCount}</span> phiếu đã đối soát trừ nợ
          </p>
        </div>

        {/* Card 2: Chờ duyệt */}
        <div className="relative overflow-hidden rounded-2xl border border-amber-200/80 dark:border-amber-900/50 bg-gradient-to-br from-amber-50/60 via-white to-white dark:from-amber-950/20 dark:via-slate-900 dark:to-slate-900 p-5 shadow-xs transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-800 dark:text-amber-400">
              ĐANG CHỜ DUYỆT
            </span>
            <div className={`flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400 ${stats.pendingCount > 0 ? "animate-pulse" : ""}`}>
              <Clock className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 font-mono text-2xl font-black text-slate-900 dark:text-slate-100">
            {formatVND(stats.pendingTotal)}
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            <span className="font-bold text-amber-600 dark:text-amber-400">{stats.pendingCount}</span> phiếu cần Admin/KT xử lý
          </p>
        </div>

        {/* Card 3: Tiền mặt vs Chuyển khoản */}
        <div className="relative overflow-hidden rounded-2xl border border-sky-200/80 dark:border-sky-900/50 bg-gradient-to-br from-sky-50/60 via-white to-white dark:from-sky-950/20 dark:via-slate-900 dark:to-slate-900 p-5 shadow-xs transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-sky-800 dark:text-sky-400">
              PHƯƠNG THỨC THU
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-100 dark:bg-sky-900/50 text-sky-600 dark:text-sky-400">
              <CreditCard className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs font-semibold">
            <span className="text-slate-600 dark:text-slate-400">CK ngân hàng:</span>
            <span className="font-mono font-bold text-sky-600 dark:text-sky-400">{formatVND(stats.bankTotal)}</span>
          </div>
          <div className="mt-1 flex items-center justify-between text-xs font-semibold">
            <span className="text-slate-600 dark:text-slate-400">Tiền mặt:</span>
            <span className="font-mono font-bold text-slate-900 dark:text-slate-200">{formatVND(stats.cashTotal)}</span>
          </div>
        </div>

        {/* Card 4: Tổng số phiếu */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-400">
              TỔNG SỐ PHIẾU THU
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
              <FileText className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 font-mono text-2xl font-black text-slate-900 dark:text-slate-100">
            {stats.totalCount} <span className="text-sm font-medium text-slate-400">phiếu</span>
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {stats.cancelledCount} phiếu đã hủy bỏ
          </p>
        </div>
      </div>

      {/* ── 3. Filters & Search Toolbar ──────────────────── */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          {/* Status Tabs */}
          <div className="flex flex-wrap items-center gap-1.5">
            {STATUS_FILTERS.map((f) => {
              const isActive = statusFilter === f.value;
              return (
                <button
                  key={f.value}
                  type="button"
                  onClick={() => setStatusFilter(f.value)}
                  className={`cursor-pointer rounded-xl px-3.5 py-2 text-xs font-bold transition-all ${
                    isActive
                      ? "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-sm"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700/80"
                  }`}
                >
                  {f.label}
                  {f.value === "PENDING" && stats.pendingCount > 0 && (
                    <span className={`ml-1.5 inline-flex items-center justify-center rounded-full px-1.5 py-0.2 text-[10px] font-black ${
                      isActive ? "bg-rose-500 text-white" : "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300"
                    }`}>
                      {stats.pendingCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Search Box */}
          <div className="relative min-w-[240px] flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo mã phiếu, khách hàng, người lập..."
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 pl-10 pr-9 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Sub Filters: Method + Date range */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 dark:border-slate-800/80 pt-3 text-xs">
          <div className="flex flex-wrap items-center gap-4">
            {/* Phương thức */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 dark:text-slate-400 font-medium">Hình thức:</span>
              <select
                value={methodFilter}
                onChange={(e) => setMethodFilter(e.target.value as any)}
                className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1 text-xs font-semibold text-slate-800 dark:text-slate-200 outline-none"
              >
                <option value="ALL">Tất cả hình thức</option>
                <option value="BANK_TRANSFER">Chuyển khoản (CK)</option>
                <option value="CASH">Tiền mặt (TM)</option>
              </select>
            </div>

            {/* Thời gian */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 dark:text-slate-400 font-medium">Thời gian:</span>
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value as any)}
                className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1 text-xs font-semibold text-slate-800 dark:text-slate-200 outline-none"
              >
                <option value="ALL">Toàn bộ thời gian</option>
                <option value="TODAY">Hôm nay</option>
                <option value="7DAYS">7 ngày qua</option>
                <option value="30DAYS">30 ngày qua</option>
              </select>
            </div>
          </div>

          <div className="text-slate-500 dark:text-slate-400">
            Hiển thị <span className="font-bold text-slate-900 dark:text-slate-100">{filteredItems.length}</span> phiếu thu
          </div>
        </div>
      </div>

      {/* ── 4. Main Data Table & List View ───────────────── */}
      <div className="overflow-hidden rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
        {loading ? (
          <div className="py-16 text-center space-y-3">
            <RefreshCw className="mx-auto h-8 w-8 animate-spin text-emerald-600" />
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
              Đang tải danh sách sổ phiếu thu...
            </p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400">
              <Receipt className="h-7 w-7" />
            </div>
            <p className="text-base font-bold text-slate-800 dark:text-slate-200">
              Không tìm thấy phiếu thu nào
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              Không có phiếu thu nào khớp với bộ lọc hiện tại. Hãy thử đổi trạng thái hoặc điều kiện tìm kiếm.
            </p>
            {(searchQuery || methodFilter !== "ALL" || dateRange !== "ALL") && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setMethodFilter("ALL");
                  setDateRange("ALL");
                }}
                className="mt-2 text-xs font-bold text-emerald-600 hover:underline cursor-pointer"
              >
                Xoá bộ lọc tìm kiếm
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3.5">Mã phiếu</th>
                    <th className="px-4 py-3.5">Thời gian</th>
                    <th className="px-4 py-3.5">Khách hàng</th>
                    <th className="px-4 py-3.5">Hình thức</th>
                    <th className="px-4 py-3.5">Người lập</th>
                    <th className="px-4 py-3.5 text-right">Số tiền</th>
                    <th className="px-4 py-3.5 text-center">Trạng thái</th>
                    <th className="px-4 py-3.5 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {filteredItems.map((item) => {
                    const canCancelPending =
                      item.status === "PENDING" &&
                      (canApprove || item.userId === userId);
                    const canCancelApproved =
                      item.status === "APPROVED" && canApprove;
                    const showCancel = canCancelPending || canCancelApproved;

                    return (
                      <tr
                        key={item.id}
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        {/* Mã phiếu */}
                        <td className="px-4 py-3.5">
                          <span className="font-mono text-xs font-black text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-1 rounded-md border border-emerald-200/60 dark:border-emerald-800/50">
                            {item.receiptNumber}
                          </span>
                        </td>

                        {/* Thời gian */}
                        <td className="px-4 py-3.5 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                          {new Date(item.createdAt).toLocaleString("vi-VN", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </td>

                        {/* Khách hàng */}
                        <td className="px-4 py-3.5 max-w-[220px]">
                          <div className="font-bold text-slate-900 dark:text-slate-100 truncate">
                            {item.customerName || item.customerId}
                          </div>
                          {item.notes && (
                            <div className="text-[11px] text-slate-400 truncate" title={item.notes}>
                              {item.notes}
                            </div>
                          )}
                        </td>

                        {/* Hình thức */}
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1 font-medium text-slate-700 dark:text-slate-300">
                            {item.method === "BANK_TRANSFER" ? (
                              <>
                                <CreditCard className="h-3.5 w-3.5 text-sky-500" />
                                <span>Chuyển khoản</span>
                              </>
                            ) : (
                              <>
                                <Banknote className="h-3.5 w-3.5 text-emerald-500" />
                                <span>Tiền mặt</span>
                              </>
                            )}
                          </span>
                        </td>

                        {/* Người lập */}
                        <td className="px-4 py-3.5 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                          {item.userName || "—"}
                        </td>

                        {/* Số tiền */}
                        <td className="px-4 py-3.5 text-right font-mono text-sm font-black text-slate-900 dark:text-slate-100 whitespace-nowrap">
                          {formatVND(item.amount)}
                        </td>

                        {/* Trạng thái */}
                        <td className="px-4 py-3.5 text-center whitespace-nowrap">
                          {item.status === "PENDING" && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 dark:bg-amber-950/50 px-2.5 py-1 text-[11px] font-bold text-amber-800 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60">
                              <Clock className="h-3 w-3" />
                              Chờ duyệt
                            </span>
                          )}
                          {item.status === "APPROVED" && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-1 text-[11px] font-bold text-emerald-800 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60">
                              <Check className="h-3 w-3" />
                              Đã duyệt
                            </span>
                          )}
                          {item.status === "CANCELLED" && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 dark:bg-rose-950/50 px-2.5 py-1 text-[11px] font-bold text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800/60" title={item.cancelReason || "Đã hủy"}>
                              <X className="h-3 w-3" />
                              Đã hủy
                            </span>
                          )}
                        </td>

                        {/* Thao tác */}
                        <td className="px-4 py-3.5 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Duyệt (Chỉ cho Admin / Kế toán) */}
                            {item.status === "PENDING" && canApprove && (
                              <button
                                type="button"
                                disabled={pending}
                                onClick={() => handleApprove(item.id)}
                                title="Duyệt phiếu thu và trừ nợ khách hàng"
                                className="inline-flex cursor-pointer items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1.5 text-[11px] font-bold text-white hover:bg-emerald-500 active:scale-95 disabled:opacity-50 transition-all shadow-xs"
                              >
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                Duyệt
                              </button>
                            )}

                            {/* Nút Xem / In phiếu */}
                            <button
                              type="button"
                              onClick={() => setViewingReceipt(item)}
                              title="Xem chi tiết & In phiếu thu"
                              className="inline-flex cursor-pointer items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-1.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </button>

                            {/* Hủy phiếu */}
                            {showCancel && (
                              <button
                                type="button"
                                disabled={pending}
                                onClick={() => setCancellingItem(item)}
                                title="Hủy phiếu thu"
                                className="inline-flex cursor-pointer items-center justify-center rounded-lg border border-rose-200 dark:border-rose-800/60 bg-rose-50 dark:bg-rose-950/40 p-1.5 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/50 transition-colors"
                              >
                                <XCircle className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="block md:hidden divide-y divide-slate-100 dark:divide-slate-800">
              {filteredItems.map((item) => {
                const canCancelPending =
                  item.status === "PENDING" &&
                  (canApprove || item.userId === userId);
                const canCancelApproved =
                  item.status === "APPROVED" && canApprove;
                const showCancel = canCancelPending || canCancelApproved;

                return (
                  <div key={item.id} className="p-4 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-xs font-black text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-200/60 dark:border-emerald-800/50">
                        {item.receiptNumber}
                      </span>
                      <div>
                        {item.status === "PENDING" && (
                          <span className="rounded-full bg-amber-50 dark:bg-amber-950/50 px-2 py-0.5 text-[10px] font-bold text-amber-800 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60">
                            Chờ duyệt
                          </span>
                        )}
                        {item.status === "APPROVED" && (
                          <span className="rounded-full bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 text-[10px] font-bold text-emerald-800 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60">
                            Đã duyệt
                          </span>
                        )}
                        {item.status === "CANCELLED" && (
                          <span className="rounded-full bg-rose-50 dark:bg-rose-950/50 px-2 py-0.5 text-[10px] font-bold text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800/60">
                            Đã hủy
                          </span>
                        )}
                      </div>
                    </div>

                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                        {item.customerName || item.customerId}
                      </h3>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Người lập: {item.userName || "—"} · {new Date(item.createdAt).toLocaleString("vi-VN")}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <div className="flex items-center gap-1 text-xs text-slate-600 dark:text-slate-400">
                        {item.method === "BANK_TRANSFER" ? (
                          <>
                            <CreditCard className="h-3.5 w-3.5 text-sky-500" />
                            <span>Chuyển khoản</span>
                          </>
                        ) : (
                          <>
                            <Banknote className="h-3.5 w-3.5 text-emerald-500" />
                            <span>Tiền mặt</span>
                          </>
                        )}
                      </div>
                      <div className="font-mono text-base font-black text-slate-900 dark:text-slate-100">
                        {formatVND(item.amount)}
                      </div>
                    </div>

                    {item.notes && (
                      <div className="rounded-lg bg-slate-50 dark:bg-slate-800/50 p-2 text-xs text-slate-600 dark:text-slate-400">
                        {item.notes}
                      </div>
                    )}

                    <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
                      <button
                        type="button"
                        onClick={() => setViewingReceipt(item)}
                        className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300"
                      >
                        Xem & In
                      </button>

                      {item.status === "PENDING" && canApprove && (
                        <button
                          type="button"
                          disabled={pending}
                          onClick={() => handleApprove(item.id)}
                          className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white shadow-xs"
                        >
                          Duyệt thu nợ
                        </button>
                      )}

                      {showCancel && (
                        <button
                          type="button"
                          disabled={pending}
                          onClick={() => setCancellingItem(item)}
                          className="rounded-lg border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/40 px-3 py-1.5 text-xs font-bold text-rose-700 dark:text-rose-400"
                        >
                          Hủy
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* ── 5. Modal Lập Phiếu Thu Nợ Mới ───────────────── */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xl space-y-5"
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
                  <Plus className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                    Lập Phiếu Thu Nợ Khách Hàng
                  </h3>
                  <p className="text-xs text-slate-500">
                    Ghi nhận khoản thanh toán từ khách hàng vào hệ thống
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              {/* Chọn khách hàng */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Khách hàng đang còn nợ <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                    {indebtedCustomers.length > 0 ? `Có ${indebtedCustomers.length} khách còn dư nợ` : "Không có khách nào còn nợ"}
                  </span>
                </div>
                <select
                  value={createCustomerId}
                  onChange={(e) => setCreateCustomerId(e.target.value)}
                  required
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2.5 text-sm text-slate-900 dark:text-slate-100 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                >
                  <option value="">
                    {indebtedCustomers.length > 0 ? "-- Chọn khách hàng còn nợ --" : "-- Tất cả khách hàng đã thanh toán hết nợ --"}
                  </option>
                  {indebtedCustomers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.phone ? `(${c.phone})` : ""} - Còn nợ: {formatVND(c.currentDebt || 0)}
                    </option>
                  ))}
                </select>
                {selectedCustomerInfo && (
                  <div className="flex items-center justify-between rounded-xl bg-amber-50 dark:bg-amber-950/40 p-2.5 text-xs text-amber-900 dark:text-amber-200 border border-amber-200/60 dark:border-amber-800/40 shadow-xs">
                    <div>
                      <span className="text-slate-500 dark:text-slate-400">Dư nợ hiện tại: </span>
                      <span className="font-mono font-black text-sm text-rose-600 dark:text-rose-400">
                        {formatVND(selectedCustomerInfo.currentDebt || 0)}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const debtVal = Math.round(selectedCustomerInfo.currentDebt || 0);
                        setCreateAmount(debtVal.toString().replace(/\B(?=(\d{3})+(?!\d))/g, "."));
                      }}
                      className="cursor-pointer rounded-lg bg-emerald-600 dark:bg-emerald-500 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-emerald-500 active:scale-95 transition-all shadow-xs"
                    >
                      Thu hết nợ
                    </button>
                  </div>
                )}
              </div>

              {/* Số tiền thu */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Số tiền thu (VNĐ) <span className="text-rose-500">*</span>
                  </label>
                  {selectedCustomerInfo && (
                    <span className="text-[11px] text-slate-500">
                      Tối đa: {formatVND(selectedCustomerInfo.currentDebt || 0)}
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  required
                  value={createAmount}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/[^0-9]/g, "");
                    setCreateAmount(raw ? raw.replace(/\B(?=(\d{3})+(?!\d))/g, ".") : "");
                  }}
                  placeholder="Ví dụ: 15.000.000"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2.5 font-mono text-base font-bold text-slate-900 dark:text-slate-100 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                />
                {createAmount && selectedCustomerInfo && Number(createAmount.replace(/[^0-9]/g, "")) > (selectedCustomerInfo.currentDebt || 0) && (
                  <p className="text-[11px] font-semibold text-rose-500 dark:text-rose-400 flex items-center gap-1">
                    <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                    Số tiền thu vượt quá dư nợ hiện tại của khách hàng ({formatVND(selectedCustomerInfo.currentDebt || 0)})
                  </p>
                )}
                {createAmount && (
                  <p className="text-[11px] text-emerald-600 dark:text-emerald-400 italic">
                    Bằng chữ: {numberToVietnameseWords(Number(createAmount.replace(/[^0-9]/g, "")))}
                  </p>
                )}
              </div>

              {/* Phương thức thanh toán */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Hình thức thanh toán
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setCreateMethod("BANK_TRANSFER")}
                    className={`flex items-center justify-center gap-2 rounded-xl p-2.5 text-xs font-bold border transition-all ${
                      createMethod === "BANK_TRANSFER"
                        ? "border-sky-500 bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300"
                        : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    <CreditCard className="h-4 w-4" />
                    Chuyển khoản
                  </button>
                  <button
                    type="button"
                    onClick={() => setCreateMethod("CASH")}
                    className={`flex items-center justify-center gap-2 rounded-xl p-2.5 text-xs font-bold border transition-all ${
                      createMethod === "CASH"
                        ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300"
                        : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    <Banknote className="h-4 w-4" />
                    Tiền mặt
                  </button>
                </div>
              </div>

              {/* Ghi chú */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Ghi chú / Diễn giải
                </label>
                <textarea
                  rows={2}
                  value={createNotes}
                  onChange={(e) => setCreateNotes(e.target.value)}
                  placeholder="Ví dụ: Thu tiền đơn hàng tháng 9, chuyển khoản qua Techcombank..."
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2.5 text-xs text-slate-900 dark:text-slate-100 outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingCreate}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-5 py-2 text-xs font-bold text-white hover:bg-emerald-500 shadow-md shadow-emerald-600/20 disabled:opacity-50"
                >
                  {isSubmittingCreate ? "Đang xử lý..." : "Lập phiếu thu"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── 6. Modal Xác Nhận Hủy Phiếu Thu ─────────────── */}
      {cancellingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-3xl border border-rose-200 dark:border-rose-900/60 bg-white dark:bg-slate-900 p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Xác nhận hủy phiếu thu {cancellingItem.receiptNumber}
                </h3>
                <p className="text-xs text-slate-500">
                  {cancellingItem.customerName || cancellingItem.customerId} - {formatVND(cancellingItem.amount)}
                </p>
              </div>
            </div>

            {cancellingItem.status === "APPROVED" && (
              <div className="rounded-xl bg-amber-50 dark:bg-amber-950/40 p-3 text-xs text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/50 leading-relaxed">
                ⚠️ <strong>Cảnh báo quan trọng:</strong> Phiếu thu này <strong>đã được duyệt</strong> trước đó. Khi hủy, hệ thống sẽ <strong>hoàn tác (cộng lại nợ) {formatVND(cancellingItem.amount)}</strong> vào công nợ của khách hàng!
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Lý do hủy phiếu
              </label>
              <input
                type="text"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Nhập lý do hủy (sai sót số tiền, khách yêu cầu...)"
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2.5 text-xs text-slate-900 dark:text-slate-100 outline-none focus:border-rose-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => {
                  setCancellingItem(null);
                  setCancelReason("");
                }}
                className="rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100"
              >
                Đóng
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={handleConfirmCancel}
                className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-500 shadow-md shadow-rose-600/20 disabled:opacity-50"
              >
                {pending ? "Đang xử lý..." : "Xác nhận hủy phiếu"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 7. Modal Xem Chi Tiết & In Phiếu Thu Chính Quy ── */}
      {viewingReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-200">
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-2xl rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xl my-8 space-y-6"
          >
            {/* Top Toolbar */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 print:hidden">
              <div className="flex items-center gap-2">
                <Receipt className="h-5 w-5 text-emerald-600" />
                <span className="font-mono text-sm font-bold text-slate-900 dark:text-slate-100">
                  Chi tiết phiếu thu: {viewingReceipt.receiptNumber}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrint}
                  className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-emerald-500 shadow-sm"
                >
                  <Printer className="h-4 w-4" />
                  In phiếu thu
                </button>
                <button
                  type="button"
                  onClick={() => setViewingReceipt(null)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Mẫu Phiếu Thu Chuẩn A5/A4 Có Thể In */}
            <div
              ref={printReceiptRef}
              id="printable-receipt"
              className="p-6 sm:p-8 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white text-slate-900 shadow-xs space-y-6 print:border-none print:shadow-none print:p-0"
            >
              {/* Header phiếu thu */}
              <div className="flex items-start justify-between border-b border-slate-200 pb-4">
                <div>
                  <h2 className="text-base font-black tracking-tight uppercase text-slate-900">
                    CÔNG TY PHÂN PHỐI DẦU NHỚT CRM
                  </h2>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Hệ thống Phân phối & Quản lý Công nợ Dầu nhớt
                  </p>
                  <p className="text-xs text-slate-500">
                    Điện thoại: 1900 xxxx - Email: crm-daunhot@company.vn
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-xs font-bold text-slate-700">Mẫu số: 01 - TT</div>
                  <div className="text-[10px] text-slate-500 italic">
                    (Ban hành theo Thông tư 200/2014/TT-BTC)
                  </div>
                  <div className="mt-1 font-mono text-xs font-black text-emerald-700">
                    Số: {viewingReceipt.receiptNumber}
                  </div>
                </div>
              </div>

              {/* Tiêu đề chính */}
              <div className="text-center space-y-1">
                <h1 className="text-2xl font-black uppercase tracking-wider text-slate-950">
                  PHIẾU THU TIỀN
                </h1>
                <p className="text-xs italic text-slate-600">
                  Ngày {new Date(viewingReceipt.createdAt).getDate()} tháng {new Date(viewingReceipt.createdAt).getMonth() + 1} năm {new Date(viewingReceipt.createdAt).getFullYear()}
                </p>
              </div>

              {/* Thông tin chi tiết */}
              <div className="space-y-2.5 text-xs text-slate-800">
                <div className="flex">
                  <span className="w-40 font-semibold text-slate-600 shrink-0">Họ và tên người nộp tiền:</span>
                  <span className="font-bold text-slate-950">{viewingReceipt.customerName || viewingReceipt.customerId}</span>
                </div>
                <div className="flex">
                  <span className="w-40 font-semibold text-slate-600 shrink-0">Mã khách hàng:</span>
                  <span className="font-mono text-slate-900">{viewingReceipt.customerId}</span>
                </div>
                <div className="flex">
                  <span className="w-40 font-semibold text-slate-600 shrink-0">Lý do nộp:</span>
                  <span>{viewingReceipt.notes || "Thu hồi công nợ tiền dầu nhớt theo định kỳ"}</span>
                </div>
                <div className="flex">
                  <span className="w-40 font-semibold text-slate-600 shrink-0">Hình thức thanh toán:</span>
                  <span className="font-semibold">
                    {viewingReceipt.method === "BANK_TRANSFER" ? "Chuyển khoản qua ngân hàng" : "Tiền mặt"}
                  </span>
                </div>
                <div className="flex items-baseline">
                  <span className="w-40 font-semibold text-slate-600 shrink-0">Số tiền:</span>
                  <span className="font-mono text-lg font-black text-emerald-700">
                    {formatVND(viewingReceipt.amount)}
                  </span>
                </div>
                <div className="flex items-baseline">
                  <span className="w-40 font-semibold text-slate-600 shrink-0">Số tiền bằng chữ:</span>
                  <span className="font-bold italic text-slate-900">
                    {numberToVietnameseWords(viewingReceipt.amount)}
                  </span>
                </div>
                <div className="flex">
                  <span className="w-40 font-semibold text-slate-600 shrink-0">Trạng thái phiếu:</span>
                  <span className="font-bold">
                    {viewingReceipt.status === "APPROVED" ? "Đã duyệt và trừ công nợ" : viewingReceipt.status === "CANCELLED" ? "Đã hủy bỏ" : "Đang chờ duyệt"}
                  </span>
                </div>
              </div>

              {/* Khu vực chữ ký */}
              <div className="grid grid-cols-4 gap-2 pt-6 text-center text-xs">
                <div className="space-y-16">
                  <div>
                    <p className="font-bold text-slate-900">Giám đốc</p>
                    <p className="text-[10px] italic text-slate-500">(Ký, đóng dấu)</p>
                  </div>
                  <p className="font-medium text-slate-400">..................</p>
                </div>
                <div className="space-y-16">
                  <div>
                    <p className="font-bold text-slate-900">Kế toán trưởng</p>
                    <p className="text-[10px] italic text-slate-500">(Ký, họ tên)</p>
                  </div>
                  <p className="font-medium text-slate-700">{viewingReceipt.approvedBy || ".................."}</p>
                </div>
                <div className="space-y-16">
                  <div>
                    <p className="font-bold text-slate-900">Người nộp tiền</p>
                    <p className="text-[10px] italic text-slate-500">(Ký, họ tên)</p>
                  </div>
                  <p className="font-medium text-slate-700">{viewingReceipt.customerName || ".................."}</p>
                </div>
                <div className="space-y-16">
                  <div>
                    <p className="font-bold text-slate-900">Người lập phiếu</p>
                    <p className="text-[10px] italic text-slate-500">(Ký, họ tên)</p>
                  </div>
                  <p className="font-bold text-slate-800">{viewingReceipt.userName || "Nhân viên"}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
