"use client";

import { useState } from "react";
import { Order, Customer } from "@/types";
import { formatVND } from "@/lib/remix/mappers";
import {
  Printer,
  X,
  FileText,
  Receipt,
  Building2,
  CheckCircle2,
  Package,
  Calendar,
} from "lucide-react";

interface OrderPrintReceiptProps {
  order: Order | null;
  customer?: Customer;
  isOpen: boolean;
  onClose: () => void;
}

export default function OrderPrintReceipt({
  order,
  customer,
  isOpen,
  onClose,
}: OrderPrintReceiptProps) {
  const [printSize, setPrintSize] = useState<"k80" | "a4">("k80");

  if (!isOpen || !order) return null;

  const handlePrint = () => {
    window.print();
  };

  const rawTotal =
    order.items?.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0) ??
    order.total;
  const discountAmount = order.discountAmount || 0;
  const netTotal = order.total;
  const totalLiters =
    order.totalLiters ||
    order.items?.reduce((sum, item) => {
      const vol =
        item.packageType === "Phuy 200L"
          ? 200
          : item.packageType === "Thùng 18L"
          ? 18
          : item.packageType === "Xô 4L"
          ? 4
          : 1;
      return sum + item.quantity * vol;
    }, 0) || 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-3 sm:p-5 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="flex max-h-[95vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
        {/* Modal Toolbar (hidden during print) */}
        <div className="no-print flex items-center justify-between border-b border-slate-200 bg-slate-50/90 px-5 py-3.5">
          <div className="flex items-center gap-2">
            <div className="flex size-9 items-center justify-center rounded-xl bg-amber-500 text-slate-950 font-black">
              <Printer className="size-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900">
                In Phiếu Giao Hàng &amp; Thu Tiền
              </h3>
              <p className="text-[11px] text-slate-500 font-mono">
                Mã đơn: {order.id}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Format toggle */}
            <div className="flex items-center rounded-xl bg-slate-200 p-1 text-xs font-bold">
              <button
                type="button"
                onClick={() => setPrintSize("k80")}
                className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                  printSize === "k80"
                    ? "bg-white text-slate-900 shadow-xs font-black"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                In Nhiệt K80 (80mm)
              </button>
              <button
                type="button"
                onClick={() => setPrintSize("a4")}
                className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                  printSize === "a4"
                    ? "bg-white text-slate-900 shadow-xs font-black"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Khổ A4 / A5
              </button>
            </div>

            <button
              type="button"
              onClick={handlePrint}
              className="flex cursor-pointer items-center gap-1.5 rounded-xl bg-amber-500 px-3.5 py-1.5 text-xs font-bold text-slate-950 shadow-xs hover:bg-amber-400 active:scale-95 transition"
            >
              <Printer className="size-3.5" />
              <span>In Ngay</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="flex size-8 cursor-pointer items-center justify-center rounded-full text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Printable Receipt Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-100/50">
          <div
            id="printable-slip"
            className={`mx-auto bg-white shadow-md border border-slate-200 text-slate-900 transition-all ${
              printSize === "k80"
                ? "max-w-[80mm] p-4 text-[11px] leading-tight font-sans"
                : "max-w-[190mm] p-8 text-xs leading-normal font-sans"
            }`}
          >
            {/* Header */}
            <div className="text-center pb-3 border-b border-dashed border-slate-300">
              <div className="text-xs font-black uppercase tracking-wider text-slate-900">
                NHÀ PHÂN PHỐI DẦU NHỚT TOÀN QUỐC
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">
                Kho Vận: KCN Tân Bình, P. Tây Thạnh, TP.HCM
              </div>
              <div className="text-[10px] text-slate-500">
                Hotline giao nhớt: 1900 6868 · 0908.123.456
              </div>

              <div className="my-2 border-t border-slate-200 pt-2">
                <h1 className="text-xs sm:text-sm font-black uppercase tracking-wide text-slate-900">
                  PHIẾU XUẤT KHO KIÊM BÀN GIAO &amp; THU TIỀN
                </h1>
                <div className="text-[10px] font-mono text-slate-500 mt-0.5">
                  Số: <strong>{order.id}</strong> · Ngày:{" "}
                  {order.createdAt
                    ? new Date(order.createdAt).toLocaleDateString("vi-VN", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : new Date().toLocaleDateString("vi-VN")}
                </div>
              </div>
            </div>

            {/* Customer info */}
            <div className="py-2.5 border-b border-dashed border-slate-300 space-y-1 text-[11px]">
              <div>
                <span className="font-semibold text-slate-500">Khách hàng: </span>
                <strong className="text-slate-900 font-bold">{order.customer}</strong>
              </div>
              {customer?.phone && (
                <div>
                  <span className="font-semibold text-slate-500">SĐT: </span>
                  <span className="font-mono">{customer.phone}</span>
                </div>
              )}
              {customer?.address && (
                <div>
                  <span className="font-semibold text-slate-500">Địa chỉ: </span>
                  <span>{customer.address}</span>
                </div>
              )}
              {customer?.route && (
                <div>
                  <span className="font-semibold text-slate-500">Tuyến giao: </span>
                  <span className="font-mono text-slate-700">{customer.route}</span>
                </div>
              )}
            </div>

            {/* Itemized list */}
            <div className="py-2.5 border-b border-dashed border-slate-300">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-200 text-[10px] uppercase font-bold text-slate-500">
                    <th className="pb-1 text-left">Mặt hàng</th>
                    <th className="pb-1 text-center">SL</th>
                    <th className="pb-1 text-right">Đơn giá</th>
                    <th className="pb-1 text-right">T.Tiền</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-[11px]">
                  {order.items?.map((it, idx) => (
                    <tr key={idx} className="align-top">
                      <td className="py-1.5 pr-1">
                        <div className="font-bold text-slate-900 leading-tight">
                          {it.productName}
                        </div>
                        {it.packageType && (
                          <div className="text-[10px] text-slate-400 font-mono">
                            Quy cách: {it.packageType}
                          </div>
                        )}
                      </td>
                      <td className="py-1.5 px-1 text-center font-mono font-bold">
                        {it.quantity}
                      </td>
                      <td className="py-1.5 px-1 text-right font-mono text-[10px]">
                        {formatVND(it.unitPrice)}
                      </td>
                      <td className="py-1.5 pl-1 text-right font-mono font-bold">
                        {formatVND(it.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Financial Calculations */}
            <div className="py-2.5 border-b border-dashed border-slate-300 space-y-1.5 text-[11px] font-mono">
              <div className="flex justify-between text-slate-600">
                <span>Tổng tiền hàng ({totalLiters} Lít):</span>
                <span className="font-bold text-slate-900">{formatVND(rawTotal)}</span>
              </div>

              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-700 font-semibold">
                  <span>
                    Chiết khấu {order.discountPercent ? `(${order.discountPercent}%)` : ""}:
                  </span>
                  <span>-{formatVND(discountAmount)}</span>
                </div>
              )}

              {order.drumExchange && (
                <div className="text-[10px] bg-slate-50 p-1.5 rounded-lg text-slate-600 space-y-0.5">
                  <div className="flex justify-between">
                    <span>Phuy giao mới:</span>
                    <strong>+{order.drumExchange.delivered} vỏ</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Vỏ phuy thu hồi:</span>
                    <strong>-{order.drumExchange.returned} vỏ</strong>
                  </div>
                </div>
              )}

              {order.promotionNotes && (
                <div className="text-[10px] font-sans bg-amber-50 p-1.5 rounded-lg text-amber-900">
                  🎁 <strong>Quà tặng:</strong> {order.promotionNotes}
                </div>
              )}

              <div className="flex justify-between text-xs font-black border-t border-slate-300 pt-1.5 text-slate-900">
                <span>TỔNG THANH TOÁN:</span>
                <span className="text-sm font-mono text-amber-600 font-black">
                  {formatVND(netTotal)}
                </span>
              </div>
            </div>

            {/* Signatures */}
            <div className="pt-3">
              <div className="grid grid-cols-2 gap-4 text-center text-[10px]">
                <div>
                  <div className="font-bold uppercase text-slate-700">Người Nhận Hàng</div>
                  <div className="text-slate-400 text-[9px]">(Ký, ghi rõ họ tên)</div>
                  {order.signature ? (
                    <div className="mt-2 flex justify-center">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={order.signature}
                        alt="Chữ ký khách hàng"
                        className="h-12 w-auto object-contain border border-dashed border-slate-200 rounded p-1"
                      />
                    </div>
                  ) : (
                    <div className="h-12 flex items-center justify-center text-slate-300 text-[10px]">
                      ....................
                    </div>
                  )}
                  <div className="font-bold text-slate-800 mt-1">{order.customer}</div>
                </div>

                <div>
                  <div className="font-bold uppercase text-slate-700">Người Giao Hàng</div>
                  <div className="text-slate-400 text-[9px]">(Ký &amp; xác nhận cọc/tiền)</div>
                  <div className="h-12 flex items-center justify-center text-slate-300 text-[10px]">
                    ....................
                  </div>
                  <div className="font-bold text-slate-800 mt-1">Nhân viên giao nhận</div>
                </div>
              </div>

              <div className="mt-4 text-center text-[9px] text-slate-400 italic">
                Cảm ơn Quý Khách đã tin dùng sản phẩm dầu mỡ nhờn chính hãng!
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Print-specific style */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-slip,
          #printable-slip * {
            visibility: visible;
          }
          #printable-slip {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 10px;
            box-shadow: none !important;
            border: none !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
