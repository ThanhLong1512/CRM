"use client";

import { useEffect, useState, useTransition } from "react";
import {
  ClipboardList,
  MoreHorizontal,
  PackageMinus,
  PackagePlus,
  SlidersHorizontal,
} from "lucide-react";
import { toast } from "sonner";
import {
  adjustDrums,
  getCustomerDrumHistory,
  returnDrums,
} from "@/app/(private)/vo-phuy/actions";
import { IssueDrumDialog } from "@/app/(private)/vo-phuy/IssueDrumDialog";
import type {
  DrumBalanceDto,
  DrumCustomerOption,
  DrumProductOption,
  DrumTxnDto,
} from "@/lib/data/drums";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type DrumActionMenuProps = {
  balance: DrumBalanceDto;
  customers: DrumCustomerOption[];
  products: DrumProductOption[];
  onChanged: () => void;
};

function txnLabel(type: DrumTxnDto["type"]): string {
  switch (type) {
    case "ISSUE":
      return "Xuất";
    case "RETURN":
      return "Thu";
    default:
      return "Điều chỉnh";
  }
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

export function DrumActionMenu({
  balance,
  customers,
  products,
  onChanged,
}: DrumActionMenuProps) {
  const [issueOpen, setIssueOpen] = useState(false);
  const [returnOpen, setReturnOpen] = useState(false);
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [history, setHistory] = useState<DrumTxnDto[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!historyOpen) return;
    let cancelled = false;
    setHistoryLoading(true);
    void getCustomerDrumHistory(balance.customerId).then((rows) => {
      if (!cancelled) {
        setHistory(rows);
        setHistoryLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [historyOpen, balance.customerId]);

  function handleReturn(formData: FormData) {
    startTransition(async () => {
      const result = await returnDrums({
        customerId: balance.customerId,
        quantity: Number(formData.get("quantity") ?? 0),
        notes: String(formData.get("notes") ?? ""),
      });
      if (!result.success) {
        toast.error(result.error ?? result.message);
        return;
      }
      toast.success(result.message);
      setReturnOpen(false);
      onChanged();
    });
  }

  function handleAdjust(formData: FormData) {
    startTransition(async () => {
      const result = await adjustDrums({
        customerId: balance.customerId,
        targetOutstanding: Number(formData.get("target") ?? 0),
        notes: String(formData.get("notes") ?? ""),
      });
      if (!result.success) {
        toast.error(result.error ?? result.message);
        return;
      }
      toast.success(result.message);
      setAdjustOpen(false);
      onChanged();
    });
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
              aria-label="Thao tác vỏ phuy"
            />
          }
        >
          <MoreHorizontal className="size-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-40">
          <DropdownMenuItem onClick={() => setIssueOpen(true)}>
            <PackagePlus className="size-4" />
            Xuất vỏ
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setReturnOpen(true)}
            disabled={balance.outstandingDrums <= 0}
          >
            <PackageMinus className="size-4" />
            Thu vỏ
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setHistoryOpen(true)}>
            <ClipboardList className="size-4" />
            Lịch sử
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setAdjustOpen(true)}>
            <SlidersHorizontal className="size-4" />
            Điều chỉnh
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <IssueDrumDialog
        customers={customers}
        products={products}
        onChanged={onChanged}
        defaultCustomerId={balance.customerId}
        asMenuItem
        open={issueOpen}
        onOpenChange={setIssueOpen}
      />

      <Dialog open={returnOpen} onOpenChange={setReturnOpen}>
        <DialogContent className="sm:max-w-md" showCloseButton>
          <DialogHeader>
            <DialogTitle>Thu vỏ phuy</DialogTitle>
            <DialogDescription>
              {balance.customerName} đang giữ{" "}
              <strong>{balance.outstandingDrums}</strong> vỏ.
            </DialogDescription>
          </DialogHeader>
          <form action={handleReturn} className="grid gap-3">
            <div className="grid gap-2">
              <Label htmlFor={`return-qty-${balance.customerId}`}>
                Số lượng thu
              </Label>
              <Input
                id={`return-qty-${balance.customerId}`}
                name="quantity"
                type="number"
                min={1}
                max={balance.outstandingDrums}
                step={1}
                defaultValue={1}
                required
                disabled={pending}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor={`return-notes-${balance.customerId}`}>
                Ghi chú
              </Label>
              <Input
                id={`return-notes-${balance.customerId}`}
                name="notes"
                disabled={pending}
              />
            </div>
            <DialogFooter className="mx-0 mb-0 rounded-none border-0 bg-transparent p-0">
              <Button
                type="button"
                variant="outline"
                disabled={pending}
                onClick={() => setReturnOpen(false)}
              >
                Hủy
              </Button>
              <Button type="submit" disabled={pending}>
                {pending ? "Đang lưu..." : "Thu vỏ"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={adjustOpen} onOpenChange={setAdjustOpen}>
        <DialogContent className="sm:max-w-md" showCloseButton>
          <DialogHeader>
            <DialogTitle>Điều chỉnh số dư</DialogTitle>
            <DialogDescription>
              Kiểm kê / sửa số dư đang giữ của {balance.customerName} (hiện{" "}
              {balance.outstandingDrums}).
            </DialogDescription>
          </DialogHeader>
          <form action={handleAdjust} className="grid gap-3">
            <div className="grid gap-2">
              <Label htmlFor={`adjust-target-${balance.customerId}`}>
                Số dư mục tiêu
              </Label>
              <Input
                id={`adjust-target-${balance.customerId}`}
                name="target"
                type="number"
                min={0}
                step={1}
                defaultValue={balance.outstandingDrums}
                required
                disabled={pending}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor={`adjust-notes-${balance.customerId}`}>
                Lý do
              </Label>
              <Input
                id={`adjust-notes-${balance.customerId}`}
                name="notes"
                placeholder="Kiểm kê kho / thất thoát…"
                disabled={pending}
              />
            </div>
            <DialogFooter className="mx-0 mb-0 rounded-none border-0 bg-transparent p-0">
              <Button
                type="button"
                variant="outline"
                disabled={pending}
                onClick={() => setAdjustOpen(false)}
              >
                Hủy
              </Button>
              <Button type="submit" disabled={pending}>
                {pending ? "Đang lưu..." : "Điều chỉnh"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
        <DialogContent className="sm:max-w-2xl" showCloseButton>
          <DialogHeader>
            <DialogTitle>Lịch sử vỏ phuy</DialogTitle>
            <DialogDescription>{balance.customerName}</DialogDescription>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Thời gian</TableHead>
                  <TableHead>Loại</TableHead>
                  <TableHead className="text-right">SL</TableHead>
                  <TableHead>SP / Ghi chú</TableHead>
                  <TableHead>Người ghi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {historyLoading ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="h-20 text-center text-muted-foreground"
                    >
                      Đang tải…
                    </TableCell>
                  </TableRow>
                ) : history.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="h-20 text-center text-muted-foreground"
                    >
                      Chưa có giao dịch.
                    </TableCell>
                  </TableRow>
                ) : (
                  history.map((txn) => (
                    <TableRow key={txn.id}>
                      <TableCell className="whitespace-nowrap text-xs">
                        {formatDate(txn.createdAt)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            txn.type === "ISSUE"
                              ? "default"
                              : txn.type === "RETURN"
                                ? "secondary"
                                : "outline"
                          }
                        >
                          {txnLabel(txn.type)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {txn.quantity}
                      </TableCell>
                      <TableCell className="max-w-[180px] text-xs whitespace-normal text-muted-foreground">
                        {[txn.productSku, txn.notes]
                          .filter(Boolean)
                          .join(" · ") || "—"}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {txn.userName ?? "—"}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
