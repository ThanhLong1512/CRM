"use client";

import { useMemo, useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useDroppable,
  useDraggable,
  useSensor,
  useSensors,
  closestCorners,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { useQueryClient } from "@tanstack/react-query";
import type { OrderStatus } from "@prisma/client";
import { toast } from "sonner";
import { updateOrderStatus } from "@/app/(private)/don-hang/actions";
import { OrderActionMenu } from "@/app/(private)/don-hang/OrderActionMenu";
import {
  ORDERS_QUERY_KEY,
  type OrderDto,
  type OrderStatusDto,
} from "@/app/(private)/don-hang/order-query";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const vndFormatter = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
});

const KANBAN_COLUMNS: {
  id: Extract<OrderStatusDto, "PENDING" | "CONFIRMED" | "SHIPPED">;
  title: string;
}[] = [
  { id: "PENDING", title: "Chờ duyệt" },
  { id: "CONFIRMED", title: "Xuất kho" },
  { id: "SHIPPED", title: "Đã giao" },
];

type OrdersKanbanBoardProps = {
  orders: OrderDto[];
};

function OrderCard({
  order,
  dragging,
}: {
  order: OrderDto;
  dragging?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-slate-200 bg-white p-3 shadow-xs",
        dragging && "opacity-90 ring-2 ring-amber-500/40",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 space-y-1">
          <p className="truncate font-medium">{order.customerName}</p>
          <Badge
            variant={order.customerType === "FLEET" ? "default" : "secondary"}
            className="w-fit"
          >
            {order.customerType}
          </Badge>
        </div>
        <div
          className="shrink-0"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        >
          <OrderActionMenu order={order} />
        </div>
      </div>
      <p className="mt-2 text-sm font-semibold tabular-nums">
        {vndFormatter.format(order.total)}
      </p>
      <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
        {order.items
          .map((item) => `${item.productSku} × ${item.quantity}`)
          .join(", ") || "Không có dòng hàng"}
      </p>
      <p className="mt-2 text-xs text-muted-foreground">
        {order.userName || order.userEmail}
      </p>
    </div>
  );
}

function DraggableOrderCard({ order }: { order: OrderDto }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: order.id,
      data: { order },
    });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="cursor-grab touch-none active:cursor-grabbing"
      {...listeners}
      {...attributes}
    >
      <OrderCard order={order} />
    </div>
  );
}

function KanbanColumn({
  id,
  title,
  orders,
}: {
  id: string;
  title: string;
  orders: OrderDto[];
}) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex min-h-[420px] w-[280px] shrink-0 flex-col rounded-2xl border border-slate-200 bg-slate-50/80",
        isOver && "border-sky-500/60 bg-sky-50/50",
      )}
    >
      <div className="flex items-center justify-between border-b border-border px-3 py-2.5">
        <h3 className="text-sm font-semibold">{title}</h3>
        <Badge variant="secondary" className="tabular-nums">
          {orders.length}
        </Badge>
      </div>
      <div className="flex flex-1 flex-col gap-2 overflow-y-auto p-2">
        {orders.length === 0 ? (
          <p className="px-1 py-8 text-center text-xs text-muted-foreground">
            Kéo đơn vào đây
          </p>
        ) : (
          orders.map((order) => (
            <DraggableOrderCard key={order.id} order={order} />
          ))
        )}
      </div>
    </div>
  );
}

export function OrdersKanbanBoard({ orders }: OrdersKanbanBoardProps) {
  const queryClient = useQueryClient();
  const [activeId, setActiveId] = useState<string | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  const boardOrders = useMemo(
    () =>
      orders.filter(
        (o) =>
          o.status === "PENDING" ||
          o.status === "CONFIRMED" ||
          o.status === "SHIPPED",
      ),
    [orders],
  );

  const columns = useMemo(() => {
    const map: Record<string, OrderDto[]> = {
      PENDING: [],
      CONFIRMED: [],
      SHIPPED: [],
    };
    for (const order of boardOrders) {
      map[order.status]?.push(order);
    }
    return map;
  }, [boardOrders]);

  const activeOrder = activeId
    ? boardOrders.find((o) => o.id === activeId) ?? null
    : null;

  function handleDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id));
  }

  async function handleDragEnd(event: DragEndEvent) {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;

    const orderId = String(active.id);
    const order = boardOrders.find((o) => o.id === orderId);
    if (!order) return;

    let targetStatus = String(over.id);
    if (
      targetStatus !== "PENDING" &&
      targetStatus !== "CONFIRMED" &&
      targetStatus !== "SHIPPED"
    ) {
      const overOrder = boardOrders.find((o) => o.id === targetStatus);
      if (!overOrder) return;
      targetStatus = overOrder.status;
    }

    if (order.status === targetStatus) return;

    const previous = queryClient.getQueryData<OrderDto[]>(ORDERS_QUERY_KEY);

    queryClient.setQueryData<OrderDto[]>(ORDERS_QUERY_KEY, (old) =>
      (old ?? []).map((item) =>
        item.id === orderId
          ? { ...item, status: targetStatus as OrderStatusDto }
          : item,
      ),
    );

    const result = await updateOrderStatus(
      orderId,
      targetStatus as OrderStatus,
    );

    if (!result.success) {
      queryClient.setQueryData(ORDERS_QUERY_KEY, previous);
      toast.error(result.error ?? result.message);
      return;
    }

    toast.success(result.message);
    await queryClient.invalidateQueries({ queryKey: ORDERS_QUERY_KEY });
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveId(null)}
    >
      <div className="flex gap-3 overflow-x-auto pb-2">
        {KANBAN_COLUMNS.map((col) => (
          <KanbanColumn
            key={col.id}
            id={col.id}
            title={col.title}
            orders={columns[col.id] ?? []}
          />
        ))}
      </div>
      <DragOverlay>
        {activeOrder ? <OrderCard order={activeOrder} dragging /> : null}
      </DragOverlay>
    </DndContext>
  );
}
