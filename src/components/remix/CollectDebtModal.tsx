"use client";

import { useState, useEffect, useTransition } from "react";
import { Customer, DebtPayment } from "@/types";
import { formatVND } from "@/lib/remix/mappers";
import {
  createDebtPayment,
  listCustomerPayments,
} from "@/app/(private)/khach-hang/debt-actions";
import { toast } from "sonner";
import {
  X,
  Banknote,
  Building2,
  Receipt,
  Calendar,
  AlertCircle,
  CheckCircle2,
  History,
  CreditCard,
  Printer,
  Sparkles,
  ShieldCheck,
  TrendingDown,
} from "lucide-react";

interface CollectDebtModalProps {
  customer: Customer;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (customerId: string, amount: number) => void;
}

export default function CollectDebtModal({
  customer,
  isOpen,
  onClose,
  onSuccess,
}: CollectDebtModalProps) {
  const [activeTab, setActiveTab] = useState<"create" | "history">("create");
  const [amount, setAmount] = useState<number | "">("");
  const [method, setMethod] = useState<"CASH" | "BANK_TRANSFER">("CASH");
  const [notes, setNotes] = useState("");
  const [isPending, startTransition] = useTransition();

  // History state
  const [history, setHistory] = useState<DebtPayment[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Load history when tab is clicked
  useEffect(() => {
    if (activeTab === "history" && customer.id) {
      setLoadingHistory(true);
      listCustomerPayments(customer.id)
        .then((items) => {
          setHistory(items);
        })
        .catch(() => {
          toast.error("Không thể tải lịch sử thu nợ.");
        })
        .finally(() => setLoadingHistory(false));
    }
  }, [activeTab, customer.id]);

  if (!isOpen) return null;

  const currentDebt = customer.currentDebt || 0;
  const numAmount = typeof amount === "number" ? amount : 0;
  const remainingDebt = Math.max(0, currentDebt - numAmount);
  const utilizationAfter =
    customer.creditLimit > 0
      ? Math.round((remainingDebt / customer.creditLimit) * 100)
      : 0;

  const handleQuickAmount = (ratio: number) => {
    if (ratio >= 1) return; // không cho “thu hết” một chạm
    const val = Math.min(Math.round(currentDebt * ratio), currentDebt);
    setAmount(val);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (numAmount <= 0) {
      toast.error("Vui lòng nhập số tiền thu lớn hơn 0đ.");
      return;
    }
    if (numAmount > currentDebt) {
      toast.error(
        `Số tiền thu không được vượt dư nợ (${formatVND(currentDebt)}).`,
      );
      return;
    }

    startTransition(async () => {
      const res = await createDebtPayment({
        customerId: customer.id,
        amount: numAmount,
        method,
        notes: notes || undefined,
      });

      if (!res.success) {
        toast.error(res.error || res.message);
        return;
      }

      toast.success(res.message);
      onSuccess(customer.id, numAmount);
      onClose();
    });
  };

  const aging = customer.debtAging;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex size-10 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
              <Receipt className="size-5" />
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-emerald-700">
                Sổ Thu Nợ &amp; Đối Soát
              </div>
              <h3 className="text-base font-black text-slate-900 line-clamp-1">
                {customer.name}
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex size-8 cursor-pointer items-center justify-center rounded-full text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Top Summary Bar */}
        <div className="grid grid-cols-3 gap-2 border-b border-slate-100 bg-emerald-950/5 p-4 text-xs">
          <div className="rounded-xl border border-emerald-200/60 bg-white p-2.5">
            <span className="text-[11px] font-medium text-slate-500">Dư nợ hiện tại</span>
            <div className="mt-0.5 font-mono text-sm font-black text-rose-600">
              {formatVND(currentDebt)}
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-2.5">
            <span className="text-[11px] font-medium text-slate-500">Hạn mức / Hạn nợ</span>
            <div className="mt-0.5 font-mono text-xs font-bold text-slate-800">
              {formatVND(customer.creditLimit)}
              <span className="ml-1 text-[10px] text-slate-500">
                ({customer.creditTermDays || 30} ngày)
              </span>
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-2.5">
            <span className="text-[11px] font-medium text-slate-500">Tình trạng tuổi nợ</span>
            <div className="mt-0.5 flex items-center gap-1 font-bold">
              {aging?.status === "critical" ? (
                <span className="flex items-center gap-1 text-[11px] text-rose-600">
                  <AlertCircle className="size-3.5 shrink-0" />
                  Nợ xấu ({aging.maxOverdueDays}d)
                </span>
              ) : aging?.status === "warning" ? (
                <span className="flex items-center gap-1 text-[11px] text-amber-600">
                  <AlertCircle className="size-3.5 shrink-0" />
                  Quá hạn ({aging.maxOverdueDays}d)
                </span>
              ) : (
                <span className="flex items-center gap-1 text-[11px] text-emerald-600">
                  <CheckCircle2 className="size-3.5 shrink-0" />
                  Trong hạn
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-slate-200 bg-slate-100/60 px-6 pt-2">
          <button
            type="button"
            onClick={() => setActiveTab("create")}
            className={`cursor-pointer pb-2.5 px-3 text-xs font-bold transition-colors border-b-2 flex items-center gap-1.5 ${
              activeTab === "create"
                ? "border-emerald-600 text-emerald-700"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Receipt className="size-3.5" />
            Lập phiếu thu tiền
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("history")}
            className={`cursor-pointer pb-2.5 px-3 text-xs font-bold transition-colors border-b-2 flex items-center gap-1.5 ${
              activeTab === "history"
                ? "border-emerald-600 text-emerald-700"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <History className="size-3.5" />
            Lịch sử phiếu thu
          </button>
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === "create" ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-[11px] text-amber-900 font-medium leading-relaxed">
                Phiếu tạo xong ở trạng thái <strong>chờ duyệt</strong>. Công nợ
                chỉ giảm sau khi <strong>Kế toán / Admin</strong> duyệt trên sổ
                phiếu thu.
              </div>

              {/* Payment Method Selector */}
              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-700">
                  Hình thức thanh toán
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setMethod("CASH")}
                    className={`flex cursor-pointer items-center justify-center gap-2 rounded-2xl border p-2.5 text-xs font-bold transition ${
                      method === "CASH"
                        ? "border-emerald-500 bg-emerald-50 text-emerald-800 shadow-xs"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <Banknote className="size-4 text-emerald-600" />
                    Tiền mặt tại điểm
                  </button>
                  <button
                    type="button"
                    onClick={() => setMethod("BANK_TRANSFER")}
                    className={`flex cursor-pointer items-center justify-center gap-2 rounded-2xl border p-2.5 text-xs font-bold transition ${
                      method === "BANK_TRANSFER"
                        ? "border-blue-500 bg-blue-50 text-blue-800 shadow-xs"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <CreditCard className="size-4 text-blue-600" />
                    Chuyển khoản NH
                  </button>
                </div>
              </div>

              {/* Amount Input */}
              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700">
                    Số tiền thực thu (VNĐ) *
                  </label>
                  <span className="text-[11px] text-slate-500">
                    Tối đa: {formatVND(currentDebt)}
                  </span>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={amount !== "" && typeof amount === "number" ? amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".") : ""}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/[^0-9]/g, "");
                      if (!raw) {
                        setAmount("");
                        return;
                      }
                      const next = Number(raw);
                      setAmount(Number.isFinite(next) ? Math.min(next, currentDebt) : "");
                    }}
                    placeholder="VD: 15.000.000"
                    className="w-full rounded-2xl border border-slate-300 bg-slate-50/50 py-3 pr-4 pl-10 font-mono text-base font-bold text-slate-900 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                  <Banknote className="absolute top-3.5 left-3.5 size-4 text-slate-400" />
                </div>

                {/* Quick Selection Buttons */}
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] font-semibold text-slate-400">Chọn nhanh:</span>
                  <button
                    type="button"
                    onClick={() => handleQuickAmount(0.5)}
                    className="cursor-pointer rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-bold text-slate-700 hover:bg-slate-50"
                  >
                    Thu 50%
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setAmount(Math.min(10_000_000, currentDebt))
                    }
                    className="cursor-pointer rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-bold text-slate-700 hover:bg-slate-50"
                  >
                    10 Tr
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setAmount(Math.min(20_000_000, currentDebt))
                    }
                    className="cursor-pointer rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-bold text-slate-700 hover:bg-slate-50"
                  >
                    20 Tr
                  </button>
                </div>
              </div>

              {/* Notes Input */}
              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-700">
                  Ghi chú chứng từ / Mã giao dịch ngân hàng
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="VD: Anh Đức thanh toán đợt 1 tiền hàng đơn 3 phuy 15W-40 qua Vietcombank..."
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 p-3 text-xs text-slate-800 focus:border-emerald-500 focus:bg-white focus:outline-none"
                />
              </div>

              {/* Preview Box */}
              {numAmount > 0 && (
                <div className="rounded-2xl border border-amber-100 bg-amber-50/50 p-3.5 space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-700">
                    <span className="flex items-center gap-1 font-semibold">
                      <TrendingDown className="size-3.5 text-amber-600" />
                      Dư nợ dự kiến sau khi duyệt:
                    </span>
                    <span className="font-mono font-black text-slate-900">
                      {formatVND(remainingDebt)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span>Chưa trừ nợ ngay — chờ duyệt</span>
                    <span className="font-bold text-amber-800">
                      {utilizationAfter}% HM sau duyệt
                    </span>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={
                    isPending ||
                    numAmount <= 0 ||
                    numAmount > currentDebt ||
                    currentDebt <= 0
                  }
                  className="w-full cursor-pointer flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-3 text-xs font-bold text-white shadow-md shadow-emerald-600/20 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  <Receipt className="size-4" />
                  {isPending
                    ? "Đang lập phiếu..."
                    : `Lập phiếu chờ duyệt ${formatVND(numAmount)}`}
                </button>
              </div>
            </form>
          ) : (
            /* History Tab */
            <div className="space-y-3">
              {loadingHistory ? (
                <div className="py-8 text-center text-xs text-slate-400 font-mono">
                  Đang tải danh sách phiếu thu...
                </div>
              ) : history.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  Chưa có phiếu thu tiền nào được ghi nhận cho khách hàng này.
                </div>
              ) : (
                <div className="space-y-2">
                  {history.map((item) => {
                    const status = item.status || "APPROVED";
                    const statusClass =
                      status === "PENDING"
                        ? "bg-amber-100 text-amber-900"
                        : status === "CANCELLED"
                          ? "bg-slate-200 text-slate-600"
                          : "bg-emerald-100 text-emerald-800";
                    const statusLabel =
                      status === "PENDING"
                        ? "Chờ duyệt"
                        : status === "CANCELLED"
                          ? "Đã hủy"
                          : "Đã duyệt";
                    return (
                    <div
                      key={item.id}
                      className="rounded-2xl border border-slate-200 bg-slate-50/50 p-3.5 text-xs flex items-center justify-between gap-3 hover:bg-white transition"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono font-bold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-md text-[11px]">
                            {item.receiptNumber}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${statusClass}`}
                          >
                            {statusLabel}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            {new Date(item.createdAt).toLocaleDateString("vi-VN", {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                        <div className="mt-1 text-slate-700 line-clamp-1">
                          {item.notes || "Thu nợ tiền hàng dầu nhớt"}
                        </div>
                        <div className="mt-0.5 text-[10px] text-slate-400">
                          Người thu: {item.userName || "Kế toán / Sales"} ·{" "}
                          {item.method === "BANK_TRANSFER" ? "Chuyển khoản NH" : "Tiền mặt"}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono font-black text-sm text-emerald-700">
                          +{formatVND(item.amount)}
                        </div>
                        <div className="text-[10px] text-slate-400 flex items-center justify-end gap-1 mt-0.5">
                          <ShieldCheck className="size-3 text-emerald-600" />
                          {status === "APPROVED"
                            ? "Đã trừ nợ"
                            : status === "PENDING"
                              ? "Chưa trừ nợ"
                              : "Đã hủy"}
                        </div>
                      </div>
                    </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
