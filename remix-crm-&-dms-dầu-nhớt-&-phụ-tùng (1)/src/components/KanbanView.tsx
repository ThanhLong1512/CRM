import { useState } from 'react';
import { Order, OrderStatus } from '../types';
import { formatVND } from '../mockData';
import { soundFX } from '../utils/audio';
import {
  Clock,
  Package,
  Truck,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  ShieldAlert,
  ShieldCheck,
  Search,
  Filter,
  Eye,
  X,
  FileText,
  Boxes,
} from 'lucide-react';

interface KanbanViewProps {
  orders: Order[];
  onUpdateOrderStatus: (orderId: string, newStatus: OrderStatus) => void;
}

const COLUMNS: { id: OrderStatus; label: string; icon: any; color: string; bg: string }[] = [
  {
    id: 'Chờ duyệt',
    label: '1. Chờ Duyệt (Pending)',
    icon: Clock,
    color: 'text-amber-800',
    bg: 'bg-amber-50 border-amber-200',
  },
  {
    id: 'Xuất kho',
    label: '2. Kho Xuất Hàng (Picking)',
    icon: Package,
    color: 'text-blue-800',
    bg: 'bg-blue-50 border-blue-200',
  },
  {
    id: 'Giao hàng',
    label: '3. Đang Giao Tuyến (In Transit)',
    icon: Truck,
    color: 'text-purple-800',
    bg: 'bg-purple-50 border-purple-200',
  },
  {
    id: 'Hoàn thành',
    label: '4. Đã Hoàn Thành (Delivered)',
    icon: CheckCircle2,
    color: 'text-emerald-800',
    bg: 'bg-emerald-50 border-emerald-200',
  },
];

export default function KanbanView({
  orders,
  onUpdateOrderStatus,
}: KanbanViewProps) {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [filterSearch, setFilterSearch] = useState('');

  const nextStatusMap: Record<OrderStatus, OrderStatus | null> = {
    'Chờ duyệt': 'Xuất kho',
    'Xuất kho': 'Giao hàng',
    'Giao hàng': 'Hoàn thành',
    'Hoàn thành': null,
  };

  const prevStatusMap: Record<OrderStatus, OrderStatus | null> = {
    'Chờ duyệt': null,
    'Xuất kho': 'Chờ duyệt',
    'Giao hàng': 'Xuất kho',
    'Hoàn thành': 'Giao hàng',
  };

  const handleMoveOrder = (orderId: string, newStatus: OrderStatus) => {
    soundFX.playClick();
    onUpdateOrderStatus(orderId, newStatus);
  };

  const filteredOrders = orders.filter((o) => {
    return (
      o.customer.toLowerCase().includes(filterSearch.toLowerCase()) ||
      o.id.toLowerCase().includes(filterSearch.toLowerCase())
    );
  });

  return (
    <div id="kanban-view" className="p-6 max-w-7xl mx-auto space-y-6">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">
              Bàn Điều Phối &amp; Soát Lỗi Đơn Hàng Dầu Nhớt
            </h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-900 text-amber-400 font-bold font-mono">
              Industrial Kanban
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Theo dõi phân rã bốc xếp Phuy 200L / Xô 18L, chốt chặn duyệt đơn vượt hạn mức và đối soát giao vận
          </p>
        </div>

        {/* Search */}
        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm đơn hàng, khách hàng..."
            value={filterSearch}
            onChange={(e) => setFilterSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs bg-white focus:outline-none focus:border-amber-500"
          />
        </div>
      </div>

      {/* 2. Kanban 4-Column Board */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 items-start">
        {COLUMNS.map((col) => {
          const colOrders = filteredOrders.filter((o) => o.status === col.id);
          const ColIcon = col.icon;

          return (
            <div
              key={col.id}
              className="bg-slate-100/70 rounded-2xl border border-slate-200 p-3.5 flex flex-col min-h-[500px]"
            >
              {/* Column Header */}
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 rounded-lg ${col.bg}`}>
                    <ColIcon className={`w-4 h-4 ${col.color}`} />
                  </div>
                  <h3 className="font-bold text-xs text-slate-800">{col.label}</h3>
                </div>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-white text-slate-700 border border-slate-200">
                  {colOrders.length}
                </span>
              </div>

              {/* Column Cards */}
              <div className="space-y-3 flex-1 overflow-y-auto max-h-[calc(100vh-280px)] pr-1">
                {colOrders.length === 0 ? (
                  <div className="text-center py-10 text-slate-400 text-xs font-medium">
                    Không có đơn hàng
                  </div>
                ) : (
                  colOrders.map((order) => {
                    const nextSt = nextStatusMap[order.status];
                    const prevSt = prevStatusMap[order.status];

                    return (
                      <div
                        key={order.id}
                        id={`kanban-card-${order.id}`}
                        className={`bg-white rounded-xl border p-4 shadow-2xs hover:shadow-md transition-all space-y-3 ${
                          order.isOverCredit
                            ? 'border-rose-300 ring-1 ring-rose-200'
                            : 'border-slate-200'
                        }`}
                      >
                        {/* Header: ID, Customer Type, Over-Credit Pill */}
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200">
                                {order.id}
                              </span>
                              <span className="text-[10px] px-1.5 py-0.2 rounded font-semibold bg-slate-100 text-slate-600">
                                {order.customerType}
                              </span>
                            </div>
                            <div className="font-bold text-slate-900 text-sm mt-1 leading-snug">
                              {order.customer}
                            </div>
                          </div>

                          {/* Over Credit Badge */}
                          {order.isOverCredit && (
                            <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px] font-bold border border-rose-300 flex items-center gap-1 shrink-0 animate-pulse">
                              <ShieldAlert className="w-3 h-3 text-rose-600" />
                              <span>VƯỢT TRẦN</span>
                            </span>
                          )}
                        </div>

                        {/* Order Total */}
                        <div className="flex items-baseline justify-between text-xs pt-1 border-t border-slate-100">
                          <span className="text-slate-400">Giá trị đơn:</span>
                          <span className="font-mono font-extrabold text-sm text-slate-900">
                            {formatVND(order.total)}
                          </span>
                        </div>

                        {/* Picking Specifications (Phân Rã Bốc Xếp Phuy 200L & Xô 18L) */}
                        <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/80 space-y-1.5">
                          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                            <Boxes className="w-3 h-3 text-amber-600" />
                            <span>Quy Cách Bốc Xếp (Kho):</span>
                          </div>
                          <div className="grid grid-cols-2 gap-1.5 text-xs">
                            <div className="p-1.5 rounded bg-white border border-slate-200 flex items-center justify-between">
                              <span className="text-slate-500 text-[11px]">Phuy 200L:</span>
                              <span
                                className={`font-mono font-bold ${
                                  (order.pickingDetails?.drums200L || 0) > 0
                                    ? 'text-cyan-700 font-extrabold'
                                    : 'text-slate-400'
                                }`}
                              >
                                {order.pickingDetails?.drums200L || 0}
                              </span>
                            </div>
                            <div className="p-1.5 rounded bg-white border border-slate-200 flex items-center justify-between">
                              <span className="text-slate-500 text-[11px]">Xô 18L:</span>
                              <span
                                className={`font-mono font-bold ${
                                  (order.pickingDetails?.pails18L || 0) > 0
                                    ? 'text-amber-700'
                                    : 'text-slate-400'
                                }`}
                              >
                                {order.pickingDetails?.pails18L || 0}
                              </span>
                            </div>
                          </div>
                          {(order.pickingDetails?.drums200L || 0) > 0 && (
                            <div className="text-[10px] text-cyan-800 font-medium">
                              &bull; Cần palang / xe nâng bốc phuy nặng ~200kg
                            </div>
                          )}
                        </div>

                        {/* Drum Exchange Info */}
                        {order.drumExchange && (
                          <div className="text-[11px] text-slate-600 flex items-center justify-between px-1">
                            <span>Giao: {order.drumExchange.delivered} phuy</span>
                            <span className="font-semibold text-emerald-700">
                              Thu vỏ: {order.drumExchange.returned} vỏ
                            </span>
                          </div>
                        )}

                        {/* Card Actions: Prev / Detail / Next */}
                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-1.5">
                          {prevSt ? (
                            <button
                              onClick={() => handleMoveOrder(order.id, prevSt)}
                              className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100 text-xs transition-colors cursor-pointer"
                              title={`Lùi về: ${prevSt}`}
                            >
                              <ArrowLeft className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <div />
                          )}

                          <button
                            onClick={() => setSelectedOrder(order)}
                            className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            <Eye className="w-3 h-3 text-slate-500" />
                            <span>Chi Tiết</span>
                          </button>

                          {nextSt && (
                            <button
                              onClick={() => handleMoveOrder(order.id, nextSt)}
                              className="px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold flex items-center gap-1 shadow-2xs transition-colors cursor-pointer"
                              title={`Chuyển sang: ${nextSt}`}
                            >
                              <span>Chuyển</span>
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-slate-900 text-base">
                    Chi Tiết Đơn Hàng {selectedOrder.id}
                  </h4>
                  <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-100 font-bold">
                    {selectedOrder.status}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">Khách hàng: {selectedOrder.customer}</p>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Over credit notice if applicable */}
            {selectedOrder.isOverCredit && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-rose-600" />
                  <span>Đơn hàng vượt trần hạn mức công nợ</span>
                </div>
                <div>
                  Người phê duyệt bảo lãnh: <strong>{selectedOrder.creditApprovedBy || 'Giám Đốc Kinh Doanh'}</strong>
                </div>
              </div>
            )}

            {/* Items Table */}
            <div>
              <div className="text-xs font-bold text-slate-700 uppercase mb-2">
                Danh sách dầu nhớt xuất kho:
              </div>
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                {selectedOrder.items.map((item, idx) => (
                  <div key={idx} className="p-3 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-slate-900">{item.productName}</div>
                      <div className="text-slate-400 font-mono text-[11px]">
                        {item.sku} &bull; Quy cách: {item.packageType}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono font-bold text-slate-800">
                        {item.quantity} x {formatVND(item.unitPrice)}
                      </div>
                      <div className="font-mono font-extrabold text-amber-700 text-xs">
                        {formatVND(item.total)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Total and Footer */}
            <div className="p-3 bg-slate-50 rounded-xl flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-600">Tổng Tiền Thanh Toán:</span>
              <span className="font-mono text-lg font-black text-slate-900">
                {formatVND(selectedOrder.total)}
              </span>
            </div>

            <div className="flex items-center justify-end pt-2 border-t border-slate-100">
              <button
                onClick={() => setSelectedOrder(null)}
                className="px-5 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold cursor-pointer"
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
