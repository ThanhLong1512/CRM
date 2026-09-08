"use client";

import { useState, useEffect } from "react";
import { Customer, Order } from "@/types";
import {
  getZaloChatUrl,
  formatOrderConfirmationZalo,
  formatDebtReminderZalo,
  formatPromoGiftZalo,
  formatHungerAlertZalo,
} from "@/lib/zaloTemplates";
import {
  MessageCircle,
  Copy,
  Check,
  ExternalLink,
  X,
  FileText,
  CreditCard,
  Gift,
  Flame,
  Phone,
} from "lucide-react";

export type ZaloTemplateType = "order" | "debt" | "promo" | "hunger";

interface ZaloShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer?: Customer | null;
  order?: Order | null;
  initialTemplate?: ZaloTemplateType;
}

export default function ZaloShareModal({
  isOpen,
  onClose,
  customer,
  order,
  initialTemplate = "order",
}: ZaloShareModalProps) {
  const [activeTab, setActiveTab] = useState<ZaloTemplateType>(initialTemplate);
  const [messageText, setMessageText] = useState<string>("");
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    if (initialTemplate) {
      setActiveTab(initialTemplate);
    }
  }, [initialTemplate, isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    if (activeTab === "order" && order) {
      setMessageText(formatOrderConfirmationZalo(order, customer || undefined));
    } else if (activeTab === "debt" && customer) {
      setMessageText(formatDebtReminderZalo(customer));
    } else if (activeTab === "promo" && customer) {
      setMessageText(formatPromoGiftZalo(customer));
    } else if (activeTab === "hunger" && customer) {
      setMessageText(formatHungerAlertZalo(customer));
    } else if (customer) {
      setMessageText(formatDebtReminderZalo(customer));
    } else if (order) {
      setMessageText(formatOrderConfirmationZalo(order));
    }
  }, [activeTab, customer, order, isOpen]);

  if (!isOpen) return null;

  const phone = customer?.phone || "";
  const zaloUrl = getZaloChatUrl(phone);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(messageText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
      setCopied(true);
    }
  };

  const handleOpenZalo = () => {
    window.open(zaloUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-950/70 p-3 sm:p-5 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="flex max-h-[92vh] w-full max-w-xl flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-linear-to-r from-blue-700 to-blue-600 px-5 py-4 text-white">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-2xl bg-white text-blue-600 shadow-md">
              <MessageCircle className="size-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-white">
                  Gửi Tin Nhắn Zalo Cho Khách Hàng
                </h3>
                <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold text-white">
                  0đ Miễn Phí
                </span>
              </div>
              <p className="text-xs text-blue-100">
                {customer?.name || order?.customer} &bull; SĐT: {phone || "Chưa có SĐT"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex size-8 items-center justify-center rounded-xl bg-blue-800 text-blue-200 hover:bg-blue-900 hover:text-white transition-colors cursor-pointer"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Template Selector Tabs */}
        <div className="border-b border-slate-100 bg-slate-50 p-3 overflow-x-auto flex gap-1.5 no-scrollbar shrink-0">
          {order && (
            <button
              type="button"
              onClick={() => setActiveTab("order")}
              className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === "order"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
              }`}
            >
              <FileText className="size-3.5" />
              <span>1. Xác nhận đơn hàng</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setActiveTab("debt")}
            className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "debt"
                ? "bg-blue-600 text-white shadow-xs"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
            }`}
          >
            <CreditCard className="size-3.5" />
            <span>2. Báo công nợ &amp; sổ vỏ</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("promo")}
            className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "promo"
                ? "bg-blue-600 text-white shadow-xs"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
            }`}
          >
            <Gift className="size-3.5" />
            <span>3. Quà tặng khuyến mại</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("hunger")}
            className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "hunger"
                ? "bg-blue-600 text-white shadow-xs"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
            }`}
          >
            <Flame className="size-3.5" />
            <span>4. Nhắc sắp cạn dầu</span>
          </button>
        </div>

        {/* Message Editor / Preview */}
        <div className="p-4 sm:p-5 flex-1 overflow-y-auto space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
            <span>Nội dung tin nhắn mẫu (Có thể chỉnh sửa trước khi gửi):</span>
            <span className="font-mono text-[11px] text-slate-400">
              {messageText.length} ký tự
            </span>
          </div>

          <textarea
            rows={10}
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50/80 p-3.5 text-xs sm:text-sm font-sans text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 leading-relaxed font-medium"
            placeholder="Nhập nội dung tin nhắn gửi Zalo..."
          />

          <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-3 text-xs text-blue-900 space-y-1">
            <div className="font-bold flex items-center gap-1 text-blue-800">
              <span>💡 Cách hoạt động 0 đồng:</span>
            </div>
            <p className="text-[11px] leading-relaxed text-blue-900/80">
              Nhấn <strong>"Mở Chat Zalo"</strong> để tự động mở ứng dụng Zalo trên điện thoại hoặc Zalo Web trên máy tính gửi trực tiếp tới khách hàng. Đồng thời nội dung tin nhắn cũng được sao chép sẵn vào bộ nhớ tạm.
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 border-t border-slate-100 bg-slate-50 px-5 py-3.5 shrink-0">
          <button
            type="button"
            onClick={handleCopy}
            className={`flex items-center justify-center gap-1.5 rounded-xl border px-4 py-2.5 text-xs font-bold transition-all cursor-pointer ${
              copied
                ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                : "border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
            }`}
          >
            {copied ? (
              <>
                <Check className="size-4 text-emerald-600" />
                <span>Đã Sao Chép!</span>
              </>
            ) : (
              <>
                <Copy className="size-4" />
                <span>Sao Chép Nội Dung</span>
              </>
            )}
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleOpenZalo}
              disabled={!phone}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-xs font-extrabold text-white shadow-md transition-all cursor-pointer ${
                !phone
                  ? "bg-slate-300 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700 active:scale-95"
              }`}
            >
              <MessageCircle className="size-4" />
              <span>Mở Chat Zalo Ngay</span>
              <ExternalLink className="size-3.5 opacity-80" />
            </button>

            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-100 cursor-pointer"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
