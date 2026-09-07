"use client";

import { useState, useTransition } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { OrderStatus } from "@prisma/client";
import {
  ArrowRight,
  MoreHorizontal,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import {
  cancelOrder,
  updateOrderStatus,
} from "@/app/(private)/don-hang/actions";
import {
  ORDERS_QUERY_KEY,
  statusLabel,
  type OrderDto,
} from "@/app/(private)/don-hang/order-query";
import { CUSTOMERS_QUERY_KEY } from "@/app/(private)/khach-hang/customer-query";
import { PRODUCTS_QUERY_KEY } from "@/app/(private)/san-pham/product-query";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const vndFormatter = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
});

const NEXT_STATUS: Partial<Record<OrderStatus, OrderStatus>> = {
  PENDING: "CONFIRMED",
  CONFIRMED: "SHIPPED",
};

type OrderActionMenuProps = {
  order: OrderDto;
};

export function OrderActionMenu({ order }: OrderActionMenuProps) {
  const queryClient = useQueryClient();
  const [cancelOpen, setCancelOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const nextStatus = NEXT_STATUS[order.status as OrderStatus];
  const canCancel = order.status !== "CANCELLED";

  async function invalidateRelated() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ORDERS_QUERY_KEY }),
      queryClient.invalidateQueries({ queryKey: CUSTOMERS_QUERY_KEY }),
      queryClient.invalidateQueries({ queryKey: PRODUCTS_QUERY_KEY }),
    ]);
  }

  function handleAdvance() {
    if (!nextStatus) return;
    startTransition(async () => {
      const result = await updateOrderStatus(order.id, nextStatus);
      if (!result.success) {
        toast.error(result.error ?? result.message);
        return;
      }
      toast.success(result.message);
      await invalidateRelated();
    });
  }

  function handleCancel() {
    startTransition(async () => {
      const result = await cancelOrder(order.id);
      if (!result.success) {
        toast.error(result.error ?? result.message);
        return;
      }
      toast.success(result.message);
      await invalidateRelated();
      setCancelOpen(false);
    });
  }

  if (!nextStatus && !canCancel) {
    return null;
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label="Thao tác đơn hàng"
            />
          }
        >
          <MoreHorizontal className="size-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-44">
          {nextStatus ? (
            <DropdownMenuItem onClick={handleAdvance} disabled={pending}>
              <ArrowRight className="size-4" />
              Chuyển {statusLabel(nextStatus)}
            </DropdownMenuItem>
          ) : null}
          {canCancel ? (
            <DropdownMenuItem
              variant="destructive"
              onClick={() => setCancelOpen(true)}
              disabled={pending}
            >
              <XCircle className="size-4" />
              Hủy đơn
            </DropdownMenuItem>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Hủy đơn hàng?</AlertDialogTitle>
            <AlertDialogDescription>
              Hủy đơn của <strong>{order.customerName}</strong> (
              {vndFormatter.format(order.total)}). Dư nợ và tồn kho sẽ được hoàn
              lại.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>Đóng</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={pending}
              onClick={handleCancel}
            >
              {pending ? "Đang hủy..." : "Hủy đơn"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
