"use client";

import { useDeferredValue, useMemo, useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import {
  CheckCircle2,
  ClipboardList,
  Clock3,
  Columns3,
  LayoutList,
  Search,
  Wallet,
} from "lucide-react";
import { CreateOrderDialog } from "@/app/(private)/don-hang/CreateOrderDialog";
import { OrderActionMenu } from "@/app/(private)/don-hang/OrderActionMenu";
import { OrdersKanbanBoard } from "@/app/(private)/don-hang/OrdersKanbanBoard";
import {
  ORDERS_QUERY_KEY,
  fetchOrders,
  filterOrders,
  statusLabel,
  type OrderStatusFilter,
} from "@/app/(private)/don-hang/order-query";
import { MasterListSkeleton } from "@/components/features/MasterListSkeleton";
import { PageHero, StatCard } from "@/components/features/PageHero";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

import { vndFormatter } from "@/lib/formatMoney";

function statusBadgeVariant(
  status: string,
): "default" | "secondary" | "outline" | "destructive" {
  switch (status) {
    case "PENDING":
      return "secondary";
    case "CONFIRMED":
      return "default";
    case "SHIPPED":
      return "outline";
    case "CANCELLED":
      return "destructive";
    default:
      return "outline";
  }
}

type OrdersView = "table" | "kanban";

export function OrdersPageClient() {
  const [view, setView] = useState<OrdersView>("table");
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const [status, setStatus] = useState<OrderStatusFilter>("all");

  const { data: orders = [], isFetching, isLoading, isError } = useQuery({
    queryKey: ORDERS_QUERY_KEY,
    queryFn: fetchOrders,
    placeholderData: keepPreviousData,
  });

  const filtered = useMemo(
    () => filterOrders(orders, { query: deferredQuery, status }),
    [orders, deferredQuery, status],
  );

  const totalOrders = orders.length;
  const pendingCount = orders.filter((o) => o.status === "PENDING").length;
  const confirmedCount = orders.filter((o) => o.status === "CONFIRMED").length;
  const activeValue = orders
    .filter((o) => o.status !== "CANCELLED")
    .reduce((sum, o) => sum + o.total, 0);
  const filteredTotal = filtered
    .filter((o) => o.status !== "CANCELLED")
    .reduce((sum, o) => sum + o.total, 0);
  const hasFilters = deferredQuery.trim().length > 0 || status !== "all";

  if (isLoading && orders.length === 0) {
    return <MasterListSkeleton statCount={4} columns={7} />;
  }

  return (
    <div className="space-y-6">
      <PageHero
        icon={ClipboardList}
        title="Đơn hàng & Kanban"
        description={
          <>
            Tạo đơn, kiểm soát công nợ và theo dõi trạng thái
            {isFetching && !isLoading ? " · Đang đồng bộ..." : ""}
          </>
        }
        actions={
          <>
            <div className="inline-flex rounded-xl border border-slate-200 bg-slate-50 p-0.5">
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className={cn(
                  "gap-1.5 rounded-lg",
                  view === "table" && "bg-amber-500 font-bold text-slate-950 hover:bg-amber-400",
                )}
                onClick={() => setView("table")}
              >
                <LayoutList className="size-4" aria-hidden />
                Bảng
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className={cn(
                  "gap-1.5 rounded-lg",
                  view === "kanban" && "bg-amber-500 font-bold text-slate-950 hover:bg-amber-400",
                )}
                onClick={() => setView("kanban")}
              >
                <Columns3 className="size-4" aria-hidden />
                Kanban
              </Button>
            </div>
            <CreateOrderDialog />
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Tổng đơn"
          value={totalOrders}
          hint="Đơn trong hệ thống"
          icon={ClipboardList}
          tone="sky"
        />
        <StatCard
          label="Chờ duyệt"
          value={pendingCount}
          hint="Trạng thái PENDING"
          icon={Clock3}
          tone="orange"
        />
        <StatCard
          label="Xuất kho"
          value={confirmedCount}
          hint="Trạng thái CONFIRMED"
          icon={CheckCircle2}
          tone="emerald"
        />
        <StatCard
          label="Giá trị đang mở"
          value={vndFormatter.format(activeValue)}
          hint="Không gồm đơn hủy"
          icon={Wallet}
          tone="amber"
        />
      </div>

      <Card className="rounded-2xl border border-slate-200 bg-white shadow-xs">
        <CardHeader className="pb-3">
          <CardTitle className="font-display text-base font-semibold text-slate-900">
            Bộ lọc
          </CardTitle>
          <p className="text-sm text-slate-500">
            Tìm theo khách hàng, sản phẩm, người tạo
            {view === "table" ? " và lọc trạng thái" : " (Kanban ẩn đơn hủy/nháp)"}
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3 lg:flex-row">
            <div className="relative min-w-0 flex-1">
              <Search
                className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Tìm khách hàng, SKU, người tạo..."
                className="h-10 pl-9"
              />
            </div>
            {view === "table" ? (
              <Select
                value={status}
                onValueChange={(value) => {
                  if (
                    value === "all" ||
                    value === "DRAFT" ||
                    value === "PENDING" ||
                    value === "CONFIRMED" ||
                    value === "SHIPPED" ||
                    value === "CANCELLED"
                  ) {
                    setStatus(value);
                  }
                }}
              >
                <SelectTrigger className="h-10 w-full lg:w-52">
                  <SelectValue placeholder="Tất cả trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả trạng thái</SelectItem>
                  <SelectItem value="PENDING">Chờ duyệt</SelectItem>
                  <SelectItem value="CONFIRMED">Xuất kho</SelectItem>
                  <SelectItem value="SHIPPED">Đã giao</SelectItem>
                  <SelectItem value="CANCELLED">Đã hủy</SelectItem>
                  <SelectItem value="DRAFT">Nháp</SelectItem>
                </SelectContent>
              </Select>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <p className="text-sm text-muted-foreground">
        Hiển thị {filtered.length} trên tổng số {totalOrders} đơn hàng.
      </p>

      {view === "kanban" ? (
        isError ? (
          <p className="rounded-lg border border-destructive/30 p-6 text-center text-destructive">
            Không tải được dữ liệu. Thử tải lại trang.
          </p>
        ) : (
          <OrdersKanbanBoard orders={filtered} />
        )
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Khách hàng</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Sản phẩm</TableHead>
                <TableHead>Người tạo</TableHead>
                <TableHead>Ngày tạo</TableHead>
                <TableHead className="text-right">Tổng tiền</TableHead>
                <TableHead className="w-12">
                  <span className="sr-only">Hành động</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={`sk-${i}`}>
                    {Array.from({ length: 7 }).map((_, j) => (
                      <TableCell key={j}>
                        <Skeleton className="h-5 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : isError ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="h-24 text-center text-destructive"
                  >
                    Không tải được dữ liệu. Thử tải lại trang.
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="h-24 text-center text-muted-foreground"
                  >
                    {hasFilters
                      ? "Không tìm thấy đơn hàng nào."
                      : "Chưa có đơn hàng. Bấm “Thêm đơn” để tạo mới."}
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">
                      <div className="flex flex-col gap-1">
                        <span>{order.customerName}</span>
                        <Badge
                          variant={
                            order.customerType === "FLEET"
                              ? "default"
                              : "secondary"
                          }
                          className="w-fit"
                        >
                          {order.customerType}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusBadgeVariant(order.status)}>
                        {statusLabel(order.status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-[240px] whitespace-normal text-muted-foreground">
                      {order.items
                        .map(
                          (item) =>
                            `${item.productSku} × ${item.quantity}`,
                        )
                        .join(", ")}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {order.userName || order.userEmail}
                    </TableCell>
                    <TableCell className="tabular-nums text-muted-foreground">
                      {new Date(order.createdAt).toLocaleString("vi-VN")}
                    </TableCell>
                    <TableCell className="text-right font-medium tabular-nums">
                      {vndFormatter.format(order.total)}
                    </TableCell>
                    <TableCell className="text-right">
                      <OrderActionMenu order={order} />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell colSpan={5} className="font-medium">
                  Tổng giá trị (theo bộ lọc, trừ đơn hủy)
                </TableCell>
                <TableCell className="text-right font-semibold tabular-nums">
                  {vndFormatter.format(filteredTotal)}
                </TableCell>
                <TableCell />
              </TableRow>
            </TableFooter>
          </Table>
        </div>
      )}
    </div>
  );
}
