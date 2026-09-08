"use client";

import { useMemo } from "react";
import { Customer } from "@/types";
import {
  AlertTriangle,
  Clock,
  Phone,
  ShoppingCart,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Flame,
  MessageCircle,
} from "lucide-react";

export interface HungerClientItem {
  customerId: string;
  customerName: string;
  customerPhone?: string;
  route?: string;
  avgCycleDays: number;
  daysSinceLast: number;
  remainingDays: number;
  overdue: boolean;
  level: "RED" | "YELLOW";
  favoriteProduct: string;
  favoriteSku: string;
}

interface HungerAlertCardProps {
  customers: Customer[];
  onSelectCustomerForOrder?: (customerId: string) => void;
  onOpenZaloChat?: (customer: Customer, messageType: "hunger") => void;
}

export default function HungerAlertCard({
  customers,
  onSelectCustomerForOrder,
  onOpenZaloChat,
}: HungerAlertCardProps) {
  // Derive hunger alerts from customers' last purchase days and cycle
  const hungerItems = useMemo(() => {
    const list: HungerClientItem[] = [];
    for (const c of customers) {
      const cycle = c.avgCycleDays || 21; // Default 21 days (~3 weeks for standard garage)
      const days = c.lastPurchaseDaysAgo ?? 15;
      const remaining = cycle - days;
      const overdue = remaining <= 0;

      let level: "RED" | "YELLOW" | null = null;
      if (overdue || remaining <= 2) {
        level = "RED";
      } else if (remaining <= 5) {
        level = "YELLOW";
      }

      if (level) {
        list.push({
          customerId: c.id,
          customerName: c.name,
          customerPhone: c.phone,
          route: c.route,
          avgCycleDays: cycle,
          daysSinceLast: days,
          remainingDays: remaining,
          overdue,
          level,
          favoriteProduct: c.favoriteSku
            ? `Dầu Động Cơ Turbo Diesel 15W-40 CI-4 Phuy 200L`
            : "Dầu Động Cơ Diesel 15W-40 CI-4",
          favoriteSku: c.favoriteSku || "DN-15W40-200L",
        });
      }
    }

    return list.sort((a, b) => {
      if (a.level !== b.level) return a.level === "RED" ? -1 : 1;
      return a.remainingDays - b.remainingDays;
    });
  }, [customers]);

  const redCount = hungerItems.filter((i) => i.level === "RED").length;

  if (hungerItems.length === 0) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-rose-200 bg-white p-5 shadow-xs space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="flex size-9 items-center justify-center rounded-xl bg-rose-500 text-white shadow-xs">
            <Flame className="size-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-extrabold text-slate-900">
                Dự Báo Chu Kỳ Tiêu Thụ Dầu (Cảnh Báo Sắp Hết Nhớt)
              </h3>
              <span className="rounded-full bg-rose-100 px-2 py-0.5 text-xs font-black text-rose-700 font-mono">
                {redCount} Garage Cần Nhắc Đơn
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Tự động cảnh báo khi garage đến hạn cạn phuy nhớt theo chu kỳ lịch sử lấy hàng
            </p>
          </div>
        </div>

        <div className="text-xs font-mono font-semibold text-slate-400">
          Chống mất khách vào tay đối thủ
        </div>
      </div>

      {/* Grid of Alert Items */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
        {hungerItems.map((item) => {
          const matchedCust = customers.find((c) => c.id === item.customerId);
          const isOverdue = item.overdue;

          return (
            <div
              key={item.customerId}
              className={`rounded-2xl border p-4 flex flex-col justify-between transition-all ${
                item.level === "RED"
                  ? "border-rose-300 bg-rose-50/50 hover:bg-rose-50 shadow-xs"
                  : "border-amber-300 bg-amber-50/40 hover:bg-amber-50 shadow-xs"
              }`}
            >
              <div className="space-y-2.5">
                {/* Status Badges */}
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wider ${
                      isOverdue
                        ? "bg-rose-600 text-white"
                        : "bg-amber-500 text-slate-950 font-bold"
                    }`}
                  >
                    {isOverdue
                      ? `Quá chu kỳ +${Math.abs(item.remainingDays)} ngày`
                      : `Còn ~${item.remainingDays} ngày hết dầu`}
                  </span>
                  <span className="text-[11px] font-mono text-slate-500">
                    Chu kỳ: <strong>{item.avgCycleDays} ngày</strong>
                  </span>
                </div>

                {/* Customer Title */}
                <div>
                  <h4 className="text-sm font-extrabold text-slate-900 leading-tight">
                    {item.customerName}
                  </h4>
                  <div className="text-xs text-slate-500 mt-0.5">
                    Tuyến: <strong>{item.route || "Tuyến trung tâm"}</strong>
                    {item.customerPhone && (
                      <span> &bull; {item.customerPhone}</span>
                    )}
                  </div>
                </div>

                {/* Favorite Product Alert */}
                <div className="rounded-xl bg-white/90 border border-slate-200/80 p-2.5 text-xs space-y-1">
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1">
                    <Sparkles className="size-3 text-amber-500" />
                    <span>Mặt hàng tiêu thụ chính sắp hết:</span>
                  </div>
                  <div className="font-bold text-slate-800 text-xs truncate">
                    {item.favoriteProduct}
                  </div>
                  <div className="flex justify-between items-center text-[11px] text-slate-400 font-mono">
                    <span>Đã {item.daysSinceLast} ngày chưa nhập</span>
                    <span className="text-rose-600 font-bold">Cần tái đặt hàng</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-3 pt-3 border-t border-slate-200/70 flex items-center justify-between gap-2">
                {item.customerPhone && (
                  <a
                    href={`tel:${item.customerPhone}`}
                    className="flex items-center gap-1 rounded-xl border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                    title="Gọi điện trực tiếp cho chủ garage"
                  >
                    <Phone className="size-3 text-emerald-600" />
                    <span>Gọi</span>
                  </a>
                )}

                {onOpenZaloChat && matchedCust && (
                  <button
                    type="button"
                    onClick={() => onOpenZaloChat(matchedCust, "hunger")}
                    className="flex items-center gap-1 rounded-xl border border-blue-200 bg-blue-50 px-2.5 py-1.5 text-xs font-bold text-blue-700 hover:bg-blue-100 transition-colors cursor-pointer"
                    title="Gửi tin Zalo chăm sóc nhắc sắp hết nhớt"
                  >
                    <MessageCircle className="size-3 text-blue-600" />
                    <span>Zalo</span>
                  </button>
                )}

                {onSelectCustomerForOrder && (
                  <button
                    type="button"
                    onClick={() => onSelectCustomerForOrder(item.customerId)}
                    className="flex-1 flex items-center justify-center gap-1 rounded-xl bg-slate-900 hover:bg-amber-500 hover:text-slate-950 px-3 py-1.5 text-xs font-extrabold text-white transition-colors cursor-pointer"
                  >
                    <ShoppingCart className="size-3" />
                    <span>Lên đơn</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
