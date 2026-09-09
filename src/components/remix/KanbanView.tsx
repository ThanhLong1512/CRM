"use client";

import {
  useMemo,
  useState,
  useEffect,
  type HTMLAttributes,
  type PointerEvent as ReactPointerEvent,
  type MouseEvent as ReactMouseEvent,
  type TouchEvent as ReactTouchEvent,
} from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  MouseSensor,
  TouchSensor,
  closestCorners,
  useDroppable,
  useDraggable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
  type PointerSensorOptions,
  type MouseSensorOptions,
  type TouchSensorOptions,
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
  Printer,
  MessageCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { ActionMenu, type ActionMenuItem } from "@/components/common/ActionMenu";
import OrderPrintReceipt from "./OrderPrintReceipt";
import ZaloShareModal from "./ZaloShareModal";

/**
 * Smart Sensors ignore pointer/mouse/touch events initiated on interactive elements
 * (buttons, inputs, select, links, or [data-no-dnd='true']) so they remain 100% clickable
 * while allowing any other empty area on the card to drag smoothly.
 */
function isInteractiveTarget(target: EventTarget | null): boolean {
  if (!target) return false;
  const el =
    target instanceof Element
      ? target
      : (target as Node)?.parentElement instanceof Element
        ? (target as Node).parentElement
        : null;
  return Boolean(
    el?.closest(
      "button, input, textarea, select, a, [data-no-dnd='true']",
    ),
  );
}

class SmartPointerSensor extends PointerSensor {
  static activators = [
    {
      eventName: "onPointerDown" as const,
      handler: (
        { nativeEvent: event }: ReactPointerEvent,
        { onActivation }: PointerSensorOptions,
      ) => {
        if (!event.isPrimary || event.button !== 0) {
          return false;
        }
        if (isInteractiveTarget(event.target as HTMLElement | null)) {
          return false;
        }
        onActivation?.({ event });
        return true;
      },
    },
  ];
}

class SmartMouseSensor extends MouseSensor {
  static activators = [
    {
      eventName: "onMouseDown" as const,
      handler: (
        { nativeEvent: event }: ReactMouseEvent,
        { onActivation }: MouseSensorOptions,
      ) => {
        if (event.button !== 0) {
          return false;
        }
        if (isInteractiveTarget(event.target as HTMLElement | null)) {
          return false;
        }
        onActivation?.({ event });
        return true;
      },
    },
  ];
}

class SmartTouchSensor extends TouchSensor {
  static activators = [
    {
      eventName: "onTouchStart" as const,
      handler: (
        { nativeEvent: event }: ReactTouchEvent,
        { onActivation }: TouchSensorOptions,
      ) => {
        if (event.touches.length > 1) {
          return false;
        }
        if (isInteractiveTarget(event.target as HTMLElement | null)) {
          return false;
        }
        onActivation?.({ event });
        return true;
      },
    },
  ];
}

interface KanbanViewProps {
  orders: Order[];
  onUpdateOrderStatus: (orderId: string, newStatus: OrderStatus) => void;
  onCancelOrder?: (orderId: string) => void;
  onApproveCreditOverride?: (orderId: string) => void;
  onRejectCreditOverride?: (orderId: string, reason?: string) => void;
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
  onPrint,
  onMove,
  onCancel,
  onApproveCreditOverride,
  onRejectCreditOverride,
  dragProps,
  isDragging,
}: {
  order: Order;
  onOpenDetail: () => void;
  onPrint?: () => void;
  onMove: (status: OrderStatus) => void;
  onCancel?: () => void;
  onApproveCreditOverride?: () => void;
  onRejectCreditOverride?: () => void;
  dragProps?: HTMLAttributes<HTMLDivElement>;
  isDragging?: boolean;
}) {
  const nextSt = nextStatusMap[order.status];
  const prevSt = prevStatusMap[order.status];
  const canCancel = order.status !== "Hoàn thành";
  const isPendingOverride = order.creditOverrideStatus === "PENDING";
  const isApprovedOverride = order.creditOverrideStatus === "APPROVED";

  return (
    <div
      {...dragProps}
      className={`group relative space-y-2.5 rounded-xl border bg-white p-3.5 shadow-xs transition-all select-none cursor-grab active:cursor-grabbing hover:shadow-md hover:border-amber-300/80 ${
        isDragging
          ? "cursor-grabbing shadow-lg ring-2 ring-amber-400 opacity-90"
          : ""
      } ${
        isPendingOverride
          ? "border-amber-300 ring-2 ring-amber-200 bg-amber-50/20"
          : order.isOverCredit
          ? "border-rose-300 ring-1 ring-rose-200"
          : "border-slate-200"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
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
        {isPendingOverride ? (
          <span className="flex shrink-0 items-center gap-1 rounded-full border border-amber-300 bg-amber-100 px-2 py-0.5 text-[10px] font-black text-amber-900 animate-pulse">
            <ShieldAlert className="size-3 text-amber-700" />
            CHỜ GĐ DUYỆT
          </span>
        ) : isApprovedOverride ? (
          <span className="flex shrink-0 items-center gap-1 rounded-full border border-emerald-300 bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
            <CheckCircle2 className="size-3 text-emerald-600" />
            ĐÃ BẢO LÃNH
          </span>
        ) : order.isOverCredit ? (
          <span className="flex shrink-0 items-center gap-1 rounded-full border border-rose-300 bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-800">
            <ShieldAlert className="size-3 text-rose-600" />
            VƯỢT TRẦN
          </span>
        ) : null}
      </div>

      {isPendingOverride && onApproveCreditOverride && (
        <div
          data-no-dnd="true"
          onPointerDown={(e) => e.stopPropagation()}
          className="flex items-center justify-between gap-1.5 rounded-lg border border-amber-300 bg-amber-50 p-2 text-xs"
        >
          <div className="truncate font-semibold text-amber-900 text-[11px]">
            {order.creditOverrideReason || "Vượt hạn mức nợ"}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={onApproveCreditOverride}
              className="cursor-pointer rounded-md bg-emerald-600 px-2 py-1 text-[11px] font-bold text-white hover:bg-emerald-500 shadow-2xs transition-colors"
              title="Phê duyệt bảo lãnh công nợ"
            >
              Duyệt
            </button>
            {onRejectCreditOverride && (
              <button
                type="button"
                onClick={onRejectCreditOverride}
                className="cursor-pointer rounded-md border border-rose-300 bg-white px-2 py-1 text-[11px] font-bold text-rose-700 hover:bg-rose-50 transition-colors"
                title="Từ chối bảo lãnh"
              >
                Từ chối
              </button>
            )}
          </div>
        </div>
      )}

      {(order.drumDelivered || order.drumReturned) ? (
        <div className="flex items-center justify-between text-[11px] text-slate-500 bg-slate-50 px-2 py-1 rounded border border-slate-100 font-mono">
          <span>Vỏ phuy:</span>
          <span className="font-bold text-sky-800">
            +{order.drumDelivered || 0} phuy / -{order.drumReturned || 0} vỏ
          </span>
        </div>
      ) : null}

      <div className="flex items-baseline justify-between border-t border-slate-100 pt-1 text-xs">
        <span className="text-slate-400">Giá trị:</span>
        <span className="font-mono text-sm font-extrabold text-slate-900">
          {formatVND(order.total)}
        </span>
      </div>

      {(order.pickingDetails || order.items?.length) && (
        <div className="hidden sm:block space-y-1.5 rounded-lg border border-slate-200/80 bg-slate-50 p-2">
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
        <div className="flex items-center gap-1.5">
          {prevSt ? (
            <button
              type="button"
              data-no-dnd="true"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={() => onMove(prevSt)}
              className="cursor-pointer rounded-lg border border-slate-200 p-1.5 text-slate-500 transition-colors hover:bg-slate-100 active:scale-95"
              title={`Lùi về: ${prevSt}`}
            >
              <ArrowLeft className="size-3.5" />
            </button>
          ) : null}

          <ActionMenu
            variant="secondary"
            size="sm"
            align="start"
            title="Tùy chọn đơn hàng"
            items={[
              {
                label: "Xem chi tiết đơn",
                icon: Eye,
                onClick: onOpenDetail,
              },
              ...(isPendingOverride && onApproveCreditOverride
                ? [
                    {
                      label: "Phê duyệt bảo lãnh (GĐ)",
                      icon: CheckCircle2,
                      onClick: onApproveCreditOverride,
                    } as ActionMenuItem,
                    ...(onRejectCreditOverride
                      ? [
                          {
                            label: "Từ chối bảo lãnh (GĐ)",
                            icon: Ban,
                            variant: "destructive" as const,
                            onClick: onRejectCreditOverride,
                          } as ActionMenuItem,
                        ]
                      : []),
                    "separator" as const,
                  ]
                : []),
              ...(onPrint
                ? [
                    {
                      label: "In phiếu xuất kho (K80 / A4)",
                      icon: Printer,
                      onClick: onPrint,
                    } as ActionMenuItem,
                  ]
                : []),
              ...(canCancel && onCancel
                ? [
                    "separator" as const,
                    {
                      label: "Hủy đơn hàng",
                      icon: Ban,
                      variant: "destructive" as const,
                      onClick: onCancel,
                    } as ActionMenuItem,
                  ]
                : []),
            ]}
          />
        </div>

        {nextSt ? (
          <button
            type="button"
            data-no-dnd="true"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => onMove(nextSt)}
            className="flex cursor-pointer items-center gap-1.5 rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-bold text-slate-950 shadow-xs transition-colors hover:bg-amber-600 active:scale-95"
            title={`Chuyển sang: ${nextSt}`}
          >
            <span>Chuyển</span>
            <ArrowRight className="size-3" />
          </button>
        ) : (
          <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
            ✓ Đã hoàn tất
          </span>
        )}
      </div>
    </div>
  );
}

function DraggableOrderCard({
  order,
  onOpenDetail,
  onPrint,
  onMove,
  onCancel,
  onApproveCreditOverride,
  onRejectCreditOverride,
}: {
  order: Order;
  onOpenDetail: () => void;
  onPrint?: () => void;
  onMove: (status: OrderStatus) => void;
  onCancel?: () => void;
  onApproveCreditOverride?: () => void;
  onRejectCreditOverride?: () => void;
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
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="touch-none cursor-grab active:cursor-grabbing"
    >
      <OrderCardBody
        order={order}
        onOpenDetail={onOpenDetail}
        onPrint={onPrint}
        onMove={onMove}
        onCancel={onCancel}
        onApproveCreditOverride={onApproveCreditOverride}
        onRejectCreditOverride={onRejectCreditOverride}
        isDragging={isDragging}
      />
    </div>
  );
}

function DroppableColumn({
  column,
  orders,
  onOpenDetail,
  onPrint,
  onMove,
  onCancel,
  onApproveCreditOverride,
  onRejectCreditOverride,
}: {
  column: (typeof COLUMNS)[number];
  orders: Order[];
  onOpenDetail: (order: Order) => void;
  onPrint: (order: Order) => void;
  onMove: (orderId: string, status: OrderStatus) => void;
  onCancel?: (orderId: string) => void;
  onApproveCreditOverride?: (orderId: string) => void;
  onRejectCreditOverride?: (orderId: string, reason?: string) => void;
}) {
  const [colPage, setColPage] = useState(1);
  const pageSize = 6;
  const totalPages = Math.max(1, Math.ceil(orders.length / pageSize));

  useEffect(() => {
    if (colPage > totalPages) {
      setColPage(totalPages);
    }
  }, [orders.length, totalPages, colPage]);

  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
    data: { type: "column", status: column.id },
  });
  const ColIcon = column.icon;

  const startIdx = (colPage - 1) * pageSize;
  const displayedOrders = orders.slice(startIdx, startIdx + pageSize);

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
          displayedOrders.map((order) => (
            <DraggableOrderCard
              key={order.id}
              order={order}
              onOpenDetail={() => onOpenDetail(order)}
              onPrint={() => onPrint(order)}
              onMove={(status) => onMove(order.id, status)}
              onCancel={onCancel ? () => onCancel(order.id) : undefined}
              onApproveCreditOverride={
                onApproveCreditOverride
                  ? () => onApproveCreditOverride(order.id)
                  : undefined
              }
              onRejectCreditOverride={
                onRejectCreditOverride
                  ? () => onRejectCreditOverride(order.id)
                  : undefined
              }
            />
          ))
        )}
      </div>

      {totalPages > 1 && (
        <div className="mt-3 flex items-center justify-between border-t border-slate-200/80 pt-2.5 text-[11px] font-medium text-slate-600 select-none">
          <button
            type="button"
            disabled={colPage <= 1}
            onClick={() => setColPage((p) => Math.max(1, p - 1))}
            className="flex items-center gap-0.5 rounded-lg border border-slate-200 bg-white px-2 py-1 text-slate-700 shadow-2xs hover:bg-slate-50 disabled:opacity-35 disabled:pointer-events-none cursor-pointer"
          >
            <ChevronLeft className="size-3.5" />
            <span>Trước</span>
          </button>

          <span className="font-mono text-xs font-bold text-slate-700">
            {colPage} / {totalPages}
          </span>

          <button
            type="button"
            disabled={colPage >= totalPages}
            onClick={() => setColPage((p) => Math.min(totalPages, p + 1))}
            className="flex items-center gap-0.5 rounded-lg border border-slate-200 bg-white px-2 py-1 text-slate-700 shadow-2xs hover:bg-slate-50 disabled:opacity-35 disabled:pointer-events-none cursor-pointer"
          >
            <span>Sau</span>
            <ChevronRight className="size-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}

export default function KanbanView({
  orders,
  onUpdateOrderStatus,
  onCancelOrder,
  onApproveCreditOverride,
  onRejectCreditOverride,
}: KanbanViewProps) {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [printingOrder, setPrintingOrder] = useState<Order | null>(null);
  const [zaloOrder, setZaloOrder] = useState<Order | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [filterSearch, setFilterSearch] = useState("");
  const [mobileColumnTab, setMobileColumnTab] = useState<string>("all");

  const sensors = useSensors(
    useSensor(SmartPointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(SmartMouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(SmartTouchSensor, {
      activationConstraint: { delay: 200, tolerance: 5 },
    }),
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
              Kéo thả thẻ đơn hàng sang cột khác để cập nhật trạng thái —{" "}
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

      {/* Mobile Column Tabs Switcher: Allows tapping between columns instead of giant scrolling */}
      <div className="flex md:hidden items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        <button
          type="button"
          onClick={() => setMobileColumnTab("all")}
          className={`shrink-0 rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
            mobileColumnTab === "all"
              ? "bg-slate-900 text-amber-400 shadow-xs"
              : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
          }`}
        >
          Tất cả ({filteredOrders.length})
        </button>
        {COLUMNS.map((col) => {
          const count = filteredOrders.filter((o) => o.status === col.id).length;
          const isSelected = mobileColumnTab === col.id;
          const ColIcon = col.icon;
          return (
            <button
              key={`tab-${col.id}`}
              type="button"
              onClick={() => setMobileColumnTab(col.id)}
              className={`shrink-0 flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                isSelected
                  ? "bg-amber-500 text-slate-950 shadow-xs ring-2 ring-amber-400/50"
                  : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              <ColIcon className="size-3.5" />
              <span>{col.label}</span>
              <span
                className={`rounded-full px-1.5 py-0.2 text-[10px] font-mono font-bold ${
                  isSelected
                    ? "bg-slate-950/20 text-slate-950"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
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
            const isVisibleOnMobile =
              mobileColumnTab === "all" || mobileColumnTab === col.id;
            const colOrders = filteredOrders.filter((o) => o.status === col.id);
            return (
              <div
                key={col.id}
                className={isVisibleOnMobile ? "block" : "hidden md:block"}
              >
                <DroppableColumn
                  column={col}
                  orders={colOrders}
                  onOpenDetail={setSelectedOrder}
                  onPrint={setPrintingOrder}
                  onMove={handleMoveOrder}
                  onCancel={onCancelOrder}
                  onApproveCreditOverride={onApproveCreditOverride}
                  onRejectCreditOverride={onRejectCreditOverride}
                />
              </div>
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
                isDragging
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

            {selectedOrder.creditOverrideStatus === "PENDING" ? (
              <div className="space-y-2 rounded-xl border border-amber-300 bg-amber-50 p-3.5 text-xs text-amber-950">
                <div className="flex items-center gap-2 font-black text-amber-900">
                  <ShieldAlert className="size-4 text-amber-600" />
                  <span>Đơn hàng đang chờ Ban Giám Đốc (ADMIN) phê duyệt bảo lãnh</span>
                </div>
                <div className="text-[11px] text-amber-800">
                  Lý do đề xuất: <strong>{selectedOrder.creditOverrideReason || "Khách hàng vượt hạn mức công nợ"}</strong>
                </div>
                {onApproveCreditOverride && (
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        onApproveCreditOverride(selectedOrder.id);
                        setSelectedOrder(null);
                      }}
                      className="cursor-pointer rounded-lg bg-emerald-600 px-3 py-1.5 font-bold text-white text-xs hover:bg-emerald-500 shadow-xs transition-colors"
                    >
                      ✓ Phê Duyệt Bảo Lãnh (GĐ)
                    </button>
                    {onRejectCreditOverride && (
                      <button
                        type="button"
                        onClick={() => {
                          onRejectCreditOverride(selectedOrder.id);
                          setSelectedOrder(null);
                        }}
                        className="cursor-pointer rounded-lg border border-rose-300 bg-white px-3 py-1.5 font-bold text-rose-700 text-xs hover:bg-rose-50 transition-colors"
                      >
                        ✕ Từ Chối Bảo Lãnh
                      </button>
                    )}
                  </div>
                )}
              </div>
            ) : selectedOrder.creditOverrideStatus === "APPROVED" ? (
              <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800">
                <CheckCircle2 className="size-4 text-emerald-600" />
                <span>
                  Đã được phê duyệt bảo lãnh bởi: <strong>{selectedOrder.creditOverrideApprovedBy || "Ban Giám Đốc"}</strong>
                </span>
              </div>
            ) : selectedOrder.isOverCredit ? (
              <div className="space-y-1 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
                <div className="flex items-center gap-1.5 font-bold">
                  <ShieldAlert className="size-4 text-rose-600" />
                  Đơn vượt trần hạn mức công nợ
                </div>
              </div>
            ) : null}

            {(selectedOrder.drumDelivered || selectedOrder.drumReturned || selectedOrder.drumDepositAmount) ? (
              <div className="flex items-center justify-between rounded-xl border border-sky-200 bg-sky-50 p-3 text-xs text-sky-900 font-mono">
                <div>
                  <span className="font-bold">Giao nhận vỏ phuy sắt:</span>
                  <div className="text-[11px] text-sky-700">
                    Giao mới: +{selectedOrder.drumDelivered || 0} phuy · Thu vỏ: -{selectedOrder.drumReturned || 0} vỏ
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-sky-600 uppercase font-sans font-bold">Cọc phuy (400k/vỏ)</div>
                  <div className="font-black text-sky-950 text-sm">
                    {formatVND(selectedOrder.drumDepositAmount || 0)}
                  </div>
                </div>
              </div>
            ) : null}

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
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPrintingOrder(selectedOrder)}
                  className="flex cursor-pointer items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-3.5 py-2 text-xs font-bold text-blue-700 hover:bg-blue-100"
                >
                  <Printer className="size-3.5 text-blue-600" />
                  In phiếu (K80/A4)
                </button>
                <button
                  type="button"
                  onClick={() => setZaloOrder(selectedOrder)}
                  className="flex cursor-pointer items-center gap-1.5 rounded-xl border border-sky-300 bg-sky-50 px-3.5 py-2 text-xs font-bold text-sky-800 hover:bg-sky-100"
                  title="Gửi phiếu xác nhận đơn hàng qua Zalo cho garage"
                >
                  <MessageCircle className="size-3.5 text-blue-600" />
                  Gửi Zalo
                </button>
                {selectedOrder.status !== "Hoàn thành" && onCancelOrder ? (
                  <button
                    type="button"
                    onClick={() => {
                      onCancelOrder(selectedOrder.id);
                      setSelectedOrder(null);
                    }}
                    className="flex cursor-pointer items-center gap-1.5 rounded-xl border border-rose-200 px-3.5 py-2 text-xs font-bold text-rose-700 hover:bg-rose-50"
                  >
                    <Ban className="size-3.5" />
                    Hủy đơn
                  </button>
                ) : null}
              </div>
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

      {/* Mobile Thermal / A4 Print Receipt Modal */}
      <OrderPrintReceipt
        order={printingOrder}
        isOpen={Boolean(printingOrder)}
        onClose={() => setPrintingOrder(null)}
      />

      {/* 1-Click Zalo Direct Chat Notification Modal */}
      <ZaloShareModal
        isOpen={Boolean(zaloOrder)}
        onClose={() => setZaloOrder(null)}
        order={zaloOrder}
        initialTemplate="order"
      />
    </div>
  );
}
