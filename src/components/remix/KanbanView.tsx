"use client";

import { useMemo, useState, type ButtonHTMLAttributes } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCorners,
  useDroppable,
  useDraggable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { Order, OrderStatus } from "../types";
import { formatVND } from "@/lib/remix/mappers";
import { soundFX } from "../utils/audio";
import {
  Clock,
  Package,
  Truck,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  ShieldAlert,
  Search,
  Eye,
  X,
  Boxes,
  Layers,
  Ban,
  GripVertical,
} from "lucide-react";

interface KanbanViewProps {
  orders: Order[];
  onUpdateOrderStatus: (orderId: string, newStatus: OrderStatus) => void;
  onCancelOrder?: (orderId: string) => void;
}

const COLUMNS: {
  id: OrderStatus;
  label: string;
  icon: typeof Clock;
  color: string;
  bg: string;
}[] = [
  {
    id: "Chờ duyệt",
    label: "1. Chờ Duyệt (Pending)",
    icon: Clock,
    color: "text-amber-800",
    bg: "bg-amber-50 border-amber-200",
  },
  {
    id: "Xuất kho",
    label: "2. Kho Xuất Hàng (Picking)",
    icon: Package,
    color: "text-blue-800",
    bg: "bg-blue-50 border-blue-200",
  },
  {
    id: "Giao hàng",
    label: "3. Đang Giao Tuyến (In Transit)",
    icon: Truck,
    color: "text-purple-800",
    bg: "bg-purple-50 border-purple-200",
  },
  {
    id: "Hoàn thành",
    label: "4. Đã Hoàn Thành (Delivered)",
    icon: CheckCircle2,
    color: "text-emerald-800",
    bg: "bg-emerald-50 border-emerald-200",
  },
];

const COLUMN_IDS = new Set<string>(COLUMNS.map((c) => c.id));

const nextStatusMap: Record<OrderStatus, OrderStatus | null> = {
  "Chờ duyệt": "Xuất kho",
  "Xuất kho": "Giao hàng",
  "Giao hàng": "Hoàn thành",
  "Hoàn thành": null,
};

const prevStatusMap: Record<OrderStatus, OrderStatus | null> = {
  "Chờ duyệt": null,
  "Xuất kho": "Chờ duyệt",
  "Giao hàng": "Xuất kho",
  "Hoàn thành": "Giao hàng",
};

function OrderCardBody({
  order,
  onOpenDetail,
  onMove,
  onCancel,
  dragHandleProps,
}: {
  order: Order;
  onOpenDetail: () => void;
  onMove: (status: OrderStatus) => void;
  onCancel?: () => void;
  dragHandleProps?: ButtonHTMLAttributes<HTMLButtonElement>;
}) {
  const nextSt = nextStatusMap[order.status];
  const prevSt = prevStatusMap[order.status];
  const canCancel = order.status !== "Hoàn thành";

  return (
    <div
      className={`space-y-2.5 rounded-xl border bg-white p-3.5 shadow-xs transition-all hover:shadow-md ${
        order.isOverCredit
          ? "border-rose-300 ring-1 ring-rose-200"
          : "border-slate-200"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            {dragHandleProps ? (
              <button
                type="button"
                className="cursor-grab touch-none rounded border border-slate-200 bg-slate-50 p-0.5 text-slate-400 hover:text-slate-700 active:cursor-grabbing"
                title="Kéo để đổi cột"
                aria-label="Kéo đơn hàng"
                {...dragHandleProps}
              >
                <GripVertical className="size-3.5" />
              </button>
            ) : null}
            <span className="rounded border border-slate-200 bg-slate-100 px-1.5 font-mono text-xs font-bold text-slate-700">
              {order.id.slice(0, 10)}
            </span>
            <span className="rounded bg-slate-100 px-1.5 text-[10px] font-semibold text-slate-600">
              {order.customerType}
            </span>
          </div>
          <div className="mt-1 text-sm leading-snug font-bold text-slate-900">
            {order.customer}
          </div>
        </div>
        {order.isOverCredit && (
          <span className="flex shrink-0 items-center gap-1 rounded-full border border-rose-300 bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-800">
            <ShieldAlert className="size-3 text-rose-600" />
            VƯỢT TRẦN
          </span>
        )}
      </div>

      <div className="flex items-baseline justify-between border-t border-slate-100 pt-1 text-xs">
        <span className="text-slate-400">Giá trị:</span>
        <span className="font-mono text-sm font-extrabold text-slate-900">
          {formatVND(order.total)}
        </span>
      </div>

      {(order.pickingDetails || order.items?.length) && (
        <div className="space-y-1.5 rounded-lg border border-slate-200/80 bg-slate-50 p-2">
          <div className="flex items-center gap-1 text-[10px] font-bold tracking-wider text-slate-500 uppercase">
            <Boxes className="size-3 text-amber-600" />
            <span>Quy cách</span>
          </div>
          <div className="grid grid-cols-2 gap-1.5 text-xs">
            <div className="flex items-center justify-between rounded border border-slate-200 bg-white p-1.5">
              <span className="text-[11px] text-slate-500">Phuy:</span>
              <span className="font-mono font-bold text-cyan-700">
                {order.pickingDetails?.drums200L || 0}
              </span>
            </div>
            <div className="flex items-center justify-between rounded border border-slate-200 bg-white p-1.5">
              <span className="text-[11px] text-slate-500">Xô:</span>
              <span className="font-mono font-bold text-amber-700">
                {order.pickingDetails?.pails18L || 0}
              </span>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between gap-1.5 border-t border-slate-100 pt-2">
        {prevSt ? (
          <button
            type="button"
            onClick={() => onMove(prevSt)}
            className="cursor-pointer rounded-lg border border-slate-200 p-1.5 text-slate-500 transition-colors hover:bg-slate-100"
            title={`Lùi về: ${prevSt}`}
          >
            <ArrowLeft className="size-3.5" />
          </button>
        ) : (
          <div />
        )}

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onOpenDetail}
            className="flex cursor-pointer items-center gap-1 rounded-lg bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-200"
          >
            <Eye className="size-3 text-slate-500" />
            Chi tiết
          </button>
          {canCancel && onCancel ? (
            <button
              type="button"
              onClick={onCancel}
              className="cursor-pointer rounded-lg border border-rose-200 p-1.5 text-rose-600 transition-colors hover:bg-rose-50"
              title="Hủy đơn"
            >
              <Ban className="size-3.5" />
            </button>
          ) : null}
        </div>

        {nextSt ? (
          <button
            type="button"
            onClick={() => onMove(nextSt)}
            className="flex cursor-pointer items-center gap-1 rounded-lg bg-amber-500 px-2.5 py-1 text-xs font-bold text-slate-950 shadow-xs transition-colors hover:bg-amber-600"
            title={`Chuyển sang: ${nextSt}`}
          >
            <span>Chuyển</span>
            <ArrowRight className="size-3" />
          </button>
        ) : (
          <div />
        )}
      </div>
    </div>
  );
}

function DraggableOrderCard({
  order,
  onOpenDetail,
  onMove,
  onCancel,
}: {
  order: Order;
  onOpenDetail: () => void;
  onMove: (status: OrderStatus) => void;
  onCancel?: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: order.id,
      data: { type: "order", order },
    });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.35 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <OrderCardBody
        order={order}
        onOpenDetail={onOpenDetail}
        onMove={onMove}
        onCancel={onCancel}
        dragHandleProps={{ ...listeners, ...attributes }}
      />
    </div>
  );
}

function DroppableColumn({
  column,
  orders,
  onOpenDetail,
  onMove,
  onCancel,
}: {
  column: (typeof COLUMNS)[number];
  orders: Order[];
  onOpenDetail: (order: Order) => void;
  onMove: (orderId: string, status: OrderStatus) => void;
  onCancel?: (orderId: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
    data: { type: "column", status: column.id },
  });
  const ColIcon = column.icon;

  return (
    <div
      ref={setNodeRef}
      className={`flex min-h-0 flex-col rounded-2xl border p-3.5 transition-colors ${
        isOver
          ? "border-amber-400 bg-amber-50/80 ring-2 ring-amber-300/50"
          : "border-slate-200 bg-slate-100/70"
      }`}
    >
      <div className="mb-3 flex items-center justify-between border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2">
          <div className={`rounded-lg border p-1.5 ${column.bg}`}>
            <ColIcon className={`size-4 ${column.color}`} />
          </div>
          <h3 className="text-xs font-bold text-slate-800">{column.label}</h3>
        </div>
        <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 font-mono text-xs font-bold text-slate-700">
          {orders.length}
        </span>
      </div>

      <div className="max-h-[calc(100vh-220px)] flex-1 space-y-3 overflow-y-auto pr-1">
        {orders.length === 0 ? (
          <div className="py-8 text-center text-xs font-medium text-slate-400">
            {isOver ? "Thả đơn vào đây" : "Kéo đơn vào đây"}
          </div>
        ) : (
          orders.map((order) => (
            <DraggableOrderCard
              key={order.id}
              order={order}
              onOpenDetail={() => onOpenDetail(order)}
              onMove={(status) => onMove(order.id, status)}
              onCancel={onCancel ? () => onCancel(order.id) : undefined}
            />
          ))
        )}
      </div>
    </div>
  );
}

export default function KanbanView({
  orders,
  onUpdateOrderStatus,
  onCancelOrder,
}: KanbanViewProps) {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [filterSearch, setFilterSearch] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  const handleMoveOrder = (orderId: string, newStatus: OrderStatus) => {
    soundFX.playClick();
    onUpdateOrderStatus(orderId, newStatus);
  };

  const filteredOrders = useMemo(
    () =>
      orders.filter(
        (o) =>
          o.customer.toLowerCase().includes(filterSearch.toLowerCase()) ||
          o.id.toLowerCase().includes(filterSearch.toLowerCase()),
      ),
    [orders, filterSearch],
  );

  const activeOrder = activeId
    ? filteredOrders.find((o) => o.id === activeId) ?? null
    : null;

  function resolveDropStatus(overId: string): OrderStatus | null {
    if (COLUMN_IDS.has(overId)) {
      return overId as OrderStatus;
    }
    const overOrder = filteredOrders.find((o) => o.id === overId);
    return overOrder?.status ?? null;
  }

  function handleDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id));
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;

    const orderId = String(active.id);
    const order = filteredOrders.find((o) => o.id === orderId);
    if (!order) return;

    const targetStatus = resolveDropStatus(String(over.id));
    if (!targetStatus || targetStatus === order.status) return;

    soundFX.playSuccess();
    onUpdateOrderStatus(orderId, targetStatus);
  }

  return (
    <div id="kanban-view" className="w-full space-y-6">
      <div className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs sm:flex-row sm:items-center">
        <div className="flex items-center gap-2.5">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-amber-600">
            <Layers className="size-5" aria-hidden />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-extrabold tracking-tight text-slate-900 sm:text-2xl">
                Bàn Điều Phối &amp; Soát Lỗi Đơn Hàng
              </h2>
              <span className="rounded-full bg-slate-900 px-2.5 py-0.5 font-mono text-xs font-bold text-amber-400">
                Industrial Kanban
              </span>
              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                Kéo-thả đổi trạng thái
              </span>
            </div>
            <p className="mt-0.5 text-xs text-slate-500">
              Kéo icon ⋮⋮ trên thẻ sang cột khác để cập nhật trạng thái —{" "}
              {filteredOrders.length}/{orders.length} đơn
            </p>
          </div>
        </div>

        <div className="relative min-w-[240px] w-full sm:w-72">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm đơn hàng, khách hàng..."
            value={filterSearch}
            onChange={(e) => setFilterSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pr-3 pl-9 text-xs focus:border-amber-500 focus:outline-none"
          />
        </div>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={() => setActiveId(null)}
      >
        <div className="grid grid-cols-1 items-stretch gap-4 md:grid-cols-2 xl:grid-cols-4">
          {COLUMNS.map((col) => {
            const colOrders = filteredOrders.filter((o) => o.status === col.id);
            return (
              <DroppableColumn
                key={col.id}
                column={col}
                orders={colOrders}
                onOpenDetail={setSelectedOrder}
                onMove={handleMoveOrder}
                onCancel={onCancelOrder}
              />
            );
          })}
        </div>

        <DragOverlay dropAnimation={null}>
          {activeOrder ? (
            <div className="w-[280px] rotate-1 opacity-95 shadow-2xl">
              <OrderCardBody
                order={activeOrder}
                onOpenDetail={() => undefined}
                onMove={() => undefined}
              />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-base font-bold text-slate-900">
                    Chi tiết {selectedOrder.id.slice(0, 12)}
                  </h4>
                  <span className="rounded bg-slate-100 px-2 py-0.5 font-mono text-xs font-bold">
                    {selectedOrder.status}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-slate-500">
                  Khách: {selectedOrder.customer}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="text-slate-400"
              >
                <X className="size-5" />
              </button>
            </div>

            {selectedOrder.isOverCredit && (
              <div className="space-y-1 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
                <div className="flex items-center gap-1.5 font-bold">
                  <ShieldAlert className="size-4 text-rose-600" />
                  Đơn vượt trần hạn mức công nợ
                </div>
              </div>
            )}

            <div>
              <div className="mb-2 text-xs font-bold text-slate-700 uppercase">
                Dòng hàng
              </div>
              <div className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200">
                {(selectedOrder.items || []).map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 text-xs"
                  >
                    <div>
                      <div className="font-bold text-slate-900">
                        {item.productName}
                      </div>
                      <div className="font-mono text-[11px] text-slate-400">
                        {item.sku} · {item.packageType}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono font-bold text-slate-800">
                        {item.quantity} × {formatVND(item.unitPrice)}
                      </div>
                      <div className="font-mono text-xs font-extrabold text-amber-700">
                        {formatVND(item.total)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3">
              <span className="text-xs font-semibold text-slate-600">
                Tổng thanh toán
              </span>
              <span className="font-mono text-lg font-black text-slate-900">
                {formatVND(selectedOrder.total)}
              </span>
            </div>

            <div className="flex items-center justify-between gap-2 border-t border-slate-100 pt-2">
              {selectedOrder.status !== "Hoàn thành" && onCancelOrder ? (
                <button
                  type="button"
                  onClick={() => {
                    onCancelOrder(selectedOrder.id);
                    setSelectedOrder(null);
                  }}
                  className="flex cursor-pointer items-center gap-1.5 rounded-xl border border-rose-200 px-4 py-2 text-xs font-bold text-rose-700 hover:bg-rose-50"
                >
                  <Ban className="size-3.5" />
                  Hủy đơn
                </button>
              ) : (
                <div />
              )}
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="cursor-pointer rounded-xl bg-slate-900 px-5 py-2 text-xs font-bold text-white"
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
