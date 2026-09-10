"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { formatVND } from "@/lib/formatMoney";
import type { ApprovalRequestItem } from "@/lib/approval/approvalEngine";
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Receipt,
  FileText,
  AlertTriangle,
  RefreshCw,
  X,
  User,
  Calendar,
  Check,
  Building2,
  Filter,
  Sliders,
  DollarSign,
} from "lucide-react";

interface ApprovalCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionRole?: string;
  onSuccessAction?: () => void;
}

export function ApprovalCenterModal({
  isOpen,
  onClose,
  sessionRole = "ADMIN",
  onSuccessAction,
}: ApprovalCenterModalProps) {
  const [items, setItems] = useState<ApprovalRequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusTab, setStatusTab] = useState<"PENDING" | "PROCESSED">("PENDING");
  const [targetTypeFilter, setTargetTypeFilter] = useState<string>("ALL");
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Reject modal state
  const [rejectingItem, setRejectingItem] = useState<ApprovalRequestItem | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const loadApprovals = useCallback(async () => {
    setLoading(true);
    try {
      const statusParam = statusTab === "PENDING" ? "PENDING" : "ALL";
      const res = await fetch(`/api/approvals?status=${statusParam}&targetType=${targetTypeFilter}`, {
        cache: "no-store",
      });
      if (!res.ok) throw new Error("Lỗi tải danh sách phê duyệt");
      const data = await res.json();
      let list: ApprovalRequestItem[] = data.items || [];
      if (statusTab === "PROCESSED") {
        list = list.filter((i) => i.status !== "PENDING");
      }
      setItems(list);
    } catch (err) {
      console.error(err);
      toast.error("Không tải được danh sách phê duyệt.");
    } finally {
      setLoading(false);
    }
  }, [statusTab, targetTypeFilter]);

  useEffect(() => {
    if (isOpen) {
      void loadApprovals();
    }
  }, [isOpen, loadApprovals]);

  // Approve action
  const handleApprove = async (item: ApprovalRequestItem) => {
    setProcessingId(item.id);
    try {
      const res = await fetch("/api/approvals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId: item.id,
          decision: "APPROVE",
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Phê duyệt thất bại");
      }
      toast.success(data.message || `Đã phê duyệt ${item.title}`);
      await loadApprovals();
      onSuccessAction?.();
    } catch (err: any) {
      toast.error(err.message || "Lỗi khi phê duyệt.");
    } finally {
      setProcessingId(null);
    }
  };

  // Reject action
  const handleConfirmReject = async () => {
    if (!rejectingItem) return;
    setProcessingId(rejectingItem.id);
    try {
      const res = await fetch("/api/approvals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId: rejectingItem.id,
          decision: "REJECT",
          reason: rejectReason.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Từ chối thất bại");
      }
      toast.success(data.message || `Đã từ chối ${rejectingItem.title}`);
      setRejectingItem(null);
      setRejectReason("");
      await loadApprovals();
      onSuccessAction?.();
    } catch (err: any) {
      toast.error(err.message || "Lỗi khi từ chối yêu cầu.");
    } finally {
      setProcessingId(null);
    }
  };

  if (!isOpen) return null;

  const pendingList = items.filter((i) => i.status === "PENDING");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex flex-col w-full max-w-3xl max-h-[90vh] rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden"
      >
        {/* ── 1. Modal Header ───────────────────────────── */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 px-6 py-4 bg-slate-50/60 dark:bg-slate-800/40">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-md shadow-amber-500/20">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-slate-900 dark:text-slate-100">
                  Trung Tâm Phê Duyệt
                </h2>
                {statusTab === "PENDING" && items.length > 0 && (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1.5 text-[11px] font-black text-white shadow-sm animate-pulse">
                    {items.length}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Quy trình phê duyệt tập trung cho Phiếu thu nợ, Đơn vượt hạn mức & các tính năng mở rộng
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => void loadApprovals()}
              disabled={loading}
              title="Làm mới"
              className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin text-amber-500" : ""}`} />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* ── 2. Filters & Status Tabs ──────────────────── */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-3 border-b border-slate-100 dark:border-slate-800 text-xs">
          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setStatusTab("PENDING")}
              className={`cursor-pointer rounded-lg px-3 py-1.5 font-bold transition-all ${
                statusTab === "PENDING"
                  ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-xs"
                  : "text-slate-500 hover:text-slate-700 dark:text-slate-400"
              }`}
            >
              Chờ phê duyệt
            </button>
            <button
              type="button"
              onClick={() => setStatusTab("PROCESSED")}
              className={`cursor-pointer rounded-lg px-3 py-1.5 font-bold transition-all ${
                statusTab === "PROCESSED"
                  ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-xs"
                  : "text-slate-500 hover:text-slate-700 dark:text-slate-400"
              }`}
            >
              Lịch sử đã xử lý
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-medium">Nghiệp vụ:</span>
            <select
              value={targetTypeFilter}
              onChange={(e) => setTargetTypeFilter(e.target.value)}
              className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1 font-semibold text-slate-700 dark:text-slate-300 outline-none"
            >
              <option value="ALL">Tất cả nghiệp vụ</option>
              <option value="DEBT_RECEIPT">Phiếu thu nợ</option>
              <option value="ORDER_CREDIT_OVERRIDE">Đơn hàng vượt nợ</option>
              <option value="SPECIAL_DISCOUNT">Chiết khấu đặc biệt</option>
              <option value="DRUM_ADJUSTMENT">Điều chỉnh vỏ phuy</option>
            </select>
          </div>
        </div>

        {/* ── 3. List of Approval Requests ─────────────── */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {loading ? (
            <div className="py-16 text-center space-y-3">
              <RefreshCw className="mx-auto h-8 w-8 animate-spin text-amber-500" />
              <p className="text-xs font-semibold text-slate-400">Đang tải danh sách chờ duyệt...</p>
            </div>
          ) : items.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400">
                <ShieldCheck className="h-7 w-7 text-emerald-500" />
              </div>
              <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                {statusTab === "PENDING" ? "Không có yêu cầu nào đang chờ duyệt" : "Chưa có lịch sử phê duyệt"}
              </p>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Tất cả phiếu thu và đơn hàng bảo lãnh đều đã được xử lý hoàn tất.
              </p>
            </div>
          ) : (
            items.map((item) => {
              const isReceipt = item.targetType === "DEBT_RECEIPT";
              const isOrder = item.targetType === "ORDER_CREDIT_OVERRIDE";
              const isProcessing = processingId === item.id;

              return (
                <div
                  key={item.id}
                  className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-4 shadow-xs hover:border-amber-300 dark:hover:border-slate-700 transition-all space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400">
                        {isReceipt ? <Receipt className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
                      </span>
                      <span className="font-mono text-xs font-black text-slate-900 dark:text-slate-100">
                        {item.targetCode}
                      </span>
                      <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[10px] font-bold text-slate-600 dark:text-slate-400">
                        {isReceipt ? "Phiếu thu nợ" : isOrder ? "Đơn vượt hạn mức" : item.targetType}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {item.status === "PENDING" && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 dark:bg-amber-950/50 px-2 py-0.5 text-[10px] font-bold text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60">
                          <Clock className="h-3 w-3" />
                          Chờ duyệt
                        </span>
                      )}
                      {item.status === "APPROVED" && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 text-[10px] font-bold text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
                          <Check className="h-3 w-3" />
                          Đã duyệt
                        </span>
                      )}
                      {item.status === "REJECTED" && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 dark:bg-rose-950/50 px-2 py-0.5 text-[10px] font-bold text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800/60">
                          <X className="h-3 w-3" />
                          Đã từ chối
                        </span>
                      )}
                      <span className="text-[11px] text-slate-400">
                        {new Date(item.createdAt).toLocaleString("vi-VN")}
                      </span>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      {item.title}
                    </h3>
                    {item.summary && (
                      <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-300">
                        {item.summary}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800/60 text-xs">
                    <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400">
                      <span>Người yêu cầu: <strong className="text-slate-700 dark:text-slate-200">{item.requesterName}</strong></span>
                      {item.amount && (
                        <span>Số tiền: <strong className="font-mono text-sm font-black text-slate-900 dark:text-slate-100">{formatVND(item.amount)}</strong></span>
                      )}
                    </div>

                    {item.status === "PENDING" && (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          disabled={isProcessing}
                          onClick={() => setRejectingItem(item)}
                          className="cursor-pointer rounded-xl border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/40 px-3 py-1.5 text-xs font-bold text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/50 active:scale-95 disabled:opacity-50 transition-all"
                        >
                          Từ chối
                        </button>
                        <button
                          type="button"
                          disabled={isProcessing}
                          onClick={() => handleApprove(item)}
                          className="cursor-pointer inline-flex items-center gap-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm active:scale-95 disabled:opacity-50 transition-all"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Duyệt ngay
                        </button>
                      </div>
                    )}

                    {item.status !== "PENDING" && item.actionUserName && (
                      <div className="text-[11px] text-slate-400">
                        Người xử lý: <strong>{item.actionUserName}</strong> {item.actionAt && `· ${new Date(item.actionAt).toLocaleString("vi-VN")}`}
                        {item.decisionReason && <span className="block text-slate-500 italic">“{item.decisionReason}”</span>}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ── 4. Reject Reason Modal ─────────────────────── */}
      {rejectingItem && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-3xl border border-rose-200 dark:border-rose-900 bg-white dark:bg-slate-900 p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Từ chối phê duyệt: {rejectingItem.targetCode}
                </h3>
                <p className="text-xs text-slate-500">{rejectingItem.title}</p>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Lý do từ chối <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={3}
                required
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Nhập lý do từ chối để người lập biết và chỉnh sửa lại..."
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2.5 text-xs text-slate-900 dark:text-slate-100 outline-none focus:border-rose-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setRejectingItem(null);
                  setRejectReason("");
                }}
                className="rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-500 shadow-md shadow-rose-600/20"
              >
                Xác nhận từ chối
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
