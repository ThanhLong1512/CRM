"use client";

import { useState, useTransition } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { issueDrums } from "@/app/(private)/vo-phuy/actions";
import type {
  DrumCustomerOption,
  DrumProductOption,
} from "@/lib/data/drums";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type IssueDrumDialogProps = {
  customers: DrumCustomerOption[];
  products: DrumProductOption[];
  onChanged: () => void;
  /** Prefill when opened from row menu */
  defaultCustomerId?: string;
  triggerLabel?: string;
  triggerVariant?: "default" | "outline" | "ghost";
  asMenuItem?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export function IssueDrumDialog({
  customers,
  products,
  onChanged,
  defaultCustomerId,
  triggerLabel = "Xuất vỏ phuy",
  triggerVariant = "default",
  asMenuItem = false,
  open: controlledOpen,
  onOpenChange,
}: IssueDrumDialogProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const open = controlledOpen ?? uncontrolledOpen;
  const setOpen = onOpenChange ?? setUncontrolledOpen;
  const [customerId, setCustomerId] = useState(
    defaultCustomerId ?? customers[0]?.id ?? "",
  );
  const [productId, setProductId] = useState(products[0]?.id ?? "");
  const [pending, startTransition] = useTransition();

  function handleOpenChange(next: boolean) {
    if (next && defaultCustomerId) setCustomerId(defaultCustomerId);
    setOpen(next);
  }

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await issueDrums({
        customerId,
        quantity: Number(formData.get("quantity") ?? 0),
        productId: productId || undefined,
        notes: String(formData.get("notes") ?? ""),
      });
      if (!result.success) {
        toast.error(result.error ?? result.message);
        return;
      }
      toast.success(result.message);
      setOpen(false);
      onChanged();
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {!asMenuItem ? (
        <DialogTrigger
          render={
            <Button
              type="button"
              variant={triggerVariant}
              className="gap-1.5 self-start sm:self-auto"
            />
          }
        >
          <Plus className="size-4" aria-hidden />
          {triggerLabel}
        </DialogTrigger>
      ) : null}
      <DialogContent className="sm:max-w-md" showCloseButton>
        <DialogHeader>
          <DialogTitle>Xuất vỏ phuy</DialogTitle>
          <DialogDescription>
            Ghi nhận vỏ phuy giao cho khách — số dư đang giữ tăng tương ứng.
          </DialogDescription>
        </DialogHeader>

        <form action={handleSubmit} className="grid gap-3">
          <div className="grid gap-2">
            <Label>Khách hàng</Label>
            <Select
              value={customerId}
              onValueChange={(v) => {
                if (typeof v === "string") setCustomerId(v);
              }}
            >
              <SelectTrigger className="h-10 w-full">
                <SelectValue placeholder="Chọn khách" />
              </SelectTrigger>
              <SelectContent>
                {customers.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                    {c.outstandingDrums > 0
                      ? ` (đang giữ ${c.outstandingDrums})`
                      : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="issue-qty">Số lượng</Label>
            <Input
              id="issue-qty"
              name="quantity"
              type="number"
              min={1}
              step={1}
              defaultValue={1}
              required
              disabled={pending}
            />
          </div>

          <div className="grid gap-2">
            <Label>Sản phẩm (vỏ phuy)</Label>
            <Select
              value={productId || "__none__"}
              onValueChange={(v) => {
                if (typeof v === "string") {
                  setProductId(v === "__none__" ? "" : v);
                }
              }}
            >
              <SelectTrigger className="h-10 w-full">
                <SelectValue placeholder="Tùy chọn" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">Không gắn SP</SelectItem>
                {products.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.sku} — {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="issue-notes">Ghi chú</Label>
            <Input
              id="issue-notes"
              name="notes"
              placeholder="Theo đơn giao…"
              disabled={pending}
            />
          </div>

          <DialogFooter className="mx-0 mb-0 rounded-none border-0 bg-transparent p-0">
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              onClick={() => setOpen(false)}
            >
              Hủy
            </Button>
            <Button type="submit" disabled={pending || !customerId}>
              {pending ? "Đang lưu..." : "Xuất vỏ"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
