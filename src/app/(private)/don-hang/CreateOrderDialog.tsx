"use client";

import { useMemo, useState, useEffect, useTransition } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Cylinder, Package } from "lucide-react";
import { toast } from "sonner";
import { createOrder } from "@/app/(private)/don-hang/actions";
import { ORDERS_QUERY_KEY } from "@/app/(private)/don-hang/order-query";
import {
  CUSTOMERS_QUERY_KEY,
  fetchCustomers,
  type CustomerDto,
} from "@/app/(private)/khach-hang/customer-query";
import {
  PRODUCTS_QUERY_KEY,
  fetchProducts,
  type ProductDto,
} from "@/app/(private)/san-pham/product-query";
import { enqueueOfflineOrder } from "@/store/offlineDB";
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

type LineDraft = {
  key: string;
  productId: string;
  quantity: number;
};

const vndFormatter = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
  maximumFractionDigits: 0,
});

function newLine(): LineDraft {
  return {
    key: `line-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    productId: "",
    quantity: 1,
  };
}

export function CreateOrderDialog() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [customerId, setCustomerId] = useState("");
  const [lines, setLines] = useState<LineDraft[]>([newLine()]);
  const [drumDelivered, setDrumDelivered] = useState<number>(0);
  const [drumReturned, setDrumReturned] = useState<number>(0);
  const DRUM_DEPOSIT_PRICE = 300000; // 300,000 VND / steel drum 200L
  const [pending, startTransition] = useTransition();

  const { data: customers = [] } = useQuery({
    queryKey: CUSTOMERS_QUERY_KEY,
    queryFn: fetchCustomers,
  });

  const { data: products = [] } = useQuery({
    queryKey: PRODUCTS_QUERY_KEY,
    queryFn: fetchProducts,
  });

  const productMap = useMemo(() => {
    const map = new Map<string, ProductDto>();
    for (const product of products) map.set(product.id, product);
    return map;
  }, [products]);

  // Auto count delivered drums from selected line items
  useEffect(() => {
    let count = 0;
    lines.forEach((line) => {
      const prod = productMap.get(line.productId);
      if (prod && (prod.sku.toUpperCase().includes("200L") || prod.name.toLowerCase().includes("phuy"))) {
        count += line.quantity;
      }
    });
    setDrumDelivered(count);
  }, [lines, productMap]);

  const selectedCustomer: CustomerDto | undefined = customers.find(
    (c) => c.id === customerId,
  );

  const lineTotals = lines.map((line) => {
    const product = productMap.get(line.productId);
    if (!product || line.quantity <= 0) return 0;
    return product.unitPrice * line.quantity;
  });

  const goodsTotal = lineTotals.reduce((sum, value) => sum + value, 0);
  const netDrumDiff = drumDelivered - drumReturned;
  const drumDepositDifference = netDrumDiff * DRUM_DEPOSIT_PRICE;
  // Số tiền phải thu = Tiền Dầu + Chênh lệch cọc vỏ (nếu trả nhiều vỏ cũ hơn thì trừ thẳng cọc vỏ)
  const totalPayable = Math.max(0, goodsTotal + drumDepositDifference);

  const creditLimit = selectedCustomer?.creditLimit ?? 0;
  const currentDebt = selectedCustomer?.currentDebt ?? 0;
  const remaining = creditLimit - currentDebt;
  const wouldExceed = Boolean(selectedCustomer) && currentDebt + totalPayable > creditLimit;

  const stockIssue = lines.some((line) => {
    const product = productMap.get(line.productId);
    if (!product || !line.productId) return false;
    return line.quantity > product.stock;
  });

  const canSubmit =
    Boolean(customerId) &&
    lines.some((line) => line.productId && line.quantity > 0) &&
    !wouldExceed &&
    !stockIssue;

  function resetForm() {
    setCustomerId("");
    setLines([newLine()]);
    setDrumDelivered(0);
    setDrumReturned(0);
  }

  function handleSubmit() {
    const items = lines
      .filter((line) => line.productId && line.quantity > 0)
      .map((line) => ({
        productId: line.productId,
        quantity: line.quantity,
      }));

    const customerName =
      selectedCustomer?.name ??
      customers.find((c) => c.id === customerId)?.name ??
      "Khách hàng";

    startTransition(async () => {
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        try {
          await enqueueOfflineOrder({
            customerId,
            customerName,
            items,
          });
          toast.success(
            "Đã lưu đơn offline. Sẽ đồng bộ khi có mạng trở lại.",
          );
          setOpen(false);
          resetForm();
        } catch (error) {
          toast.error(
            error instanceof Error
              ? error.message
              : "Không lưu được đơn offline.",
          );
        }
        return;
      }

      const result = await createOrder({ customerId, items });
      if (!result.success) {
        toast.error(result.error ?? result.message);
        return;
      }
      toast.success(result.message);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ORDERS_QUERY_KEY }),
        queryClient.invalidateQueries({ queryKey: CUSTOMERS_QUERY_KEY }),
        queryClient.invalidateQueries({ queryKey: PRODUCTS_QUERY_KEY }),
      ]);
      setOpen(false);
      resetForm();
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) resetForm();
      }}
    >
      <DialogTrigger
        render={
          <Button type="button" className="gap-1.5 self-start sm:self-auto" />
        }
      >
        <Plus className="size-4" aria-hidden />
        Thêm đơn
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl" showCloseButton>
        <DialogHeader>
          <DialogTitle>Tạo đơn hàng</DialogTitle>
          <DialogDescription>
            Chọn khách hàng, thêm sản phẩm và chốt đơn. Hệ thống sẽ kiểm tra hạn
            mức công nợ và tồn kho. Khi mất mạng, đơn được lưu tạm trên máy và
            đồng bộ sau.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label>Khách hàng</Label>
            <Select
              value={customerId || undefined}
              onValueChange={(value) => {
                if (typeof value === "string") setCustomerId(value);
              }}
              disabled={pending}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Chọn khách hàng" />
              </SelectTrigger>
              <SelectContent>
                {customers.map((customer) => (
                  <SelectItem key={customer.id} value={customer.id}>
                    {customer.name} ({customer.type})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedCustomer ? (
            <div className="rounded-md border border-border bg-muted/30 px-3 py-2 text-sm">
              <p>
                Hạn mức:{" "}
                <span className="font-medium tabular-nums">
                  {vndFormatter.format(creditLimit)}
                </span>
              </p>
              <p>
                Dư nợ hiện tại:{" "}
                <span className="font-medium tabular-nums">
                  {vndFormatter.format(currentDebt)}
                </span>
              </p>
              <p>
                Còn lại:{" "}
                <span className="font-medium tabular-nums">
                  {vndFormatter.format(remaining)}
                </span>
              </p>
            </div>
          ) : null}

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Sản phẩm</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={pending}
                onClick={() => setLines((prev) => [...prev, newLine()])}
              >
                Thêm dòng
              </Button>
            </div>

            {lines.map((line, index) => {
              const product = productMap.get(line.productId);
              return (
                <div
                  key={line.key}
                  className="grid gap-2 rounded-md border border-border p-3 sm:grid-cols-[1fr_100px_auto]"
                >
                  <Select
                    value={line.productId || undefined}
                    onValueChange={(value) => {
                      if (typeof value !== "string") return;
                      setLines((prev) =>
                        prev.map((item, i) =>
                          i === index ? { ...item, productId: value } : item,
                        ),
                      );
                    }}
                    disabled={pending}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Chọn sản phẩm" />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map((product) => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.sku} — {product.name} (tồn {product.stock})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    type="number"
                    min={1}
                    step={1}
                    value={line.quantity}
                    disabled={pending}
                    onChange={(e) => {
                      const quantity = Number.parseInt(e.target.value || "0", 10);
                      setLines((prev) =>
                        prev.map((item, i) =>
                          i === index
                            ? {
                                ...item,
                                quantity: Number.isFinite(quantity)
                                  ? quantity
                                  : 0,
                              }
                            : item,
                        ),
                      );
                    }}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    disabled={pending || lines.length === 1}
                    aria-label="Xóa dòng"
                    onClick={() =>
                      setLines((prev) => prev.filter((_, i) => i !== index))
                    }
                  >
                    <Trash2 className="size-4" />
                  </Button>
                  {product ? (
                    <p className="text-xs text-muted-foreground sm:col-span-3">
                      Đơn giá {vndFormatter.format(product.unitPrice)} · Dòng{" "}
                      {vndFormatter.format(product.unitPrice * line.quantity)}
                      {line.quantity > product.stock
                        ? " · Vượt tồn kho"
                        : ""}
                    </p>
                  ) : null}
                </div>
              );
            })}
          </div>

          {/* Section: Hoán đổi vỏ phuy & Khấu trừ cọc vỏ trực tiếp */}
          <div className="rounded-xl border border-cyan-200 bg-cyan-50/50 p-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-cyan-950 flex items-center gap-1.5">
                <Cylinder className="size-4 text-cyan-700" />
                <span>Hoán đổi vỏ phuy &amp; Trừ cọc vỏ trực tiếp</span>
              </span>
              <span className="text-[11px] font-semibold text-cyan-800 font-mono">
                Cọc: 300.000đ/vỏ 200L
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <Label className="text-xs font-semibold text-cyan-900 mb-1 block">
                  Phuy mới giao (+)
                </Label>
                <Input
                  type="number"
                  min={0}
                  value={drumDelivered}
                  disabled={pending}
                  onChange={(e) => setDrumDelivered(Math.max(0, parseInt(e.target.value || "0", 10)))}
                  className="bg-white border-cyan-300 font-mono font-bold text-cyan-900"
                />
                <span className="text-[10px] text-cyan-700">Tự động đếm theo đơn</span>
              </div>
              <div>
                <Label className="text-xs font-semibold text-emerald-900 mb-1 block">
                  Vỏ cũ thu về (-)
                </Label>
                <Input
                  type="number"
                  min={0}
                  value={drumReturned}
                  disabled={pending}
                  onChange={(e) => setDrumReturned(Math.max(0, parseInt(e.target.value || "0", 10)))}
                  className="bg-white border-emerald-300 font-mono font-bold text-emerald-900"
                />
                <span className="text-[10px] text-emerald-700">Trừ tiền cọc vỏ trực tiếp</span>
              </div>
            </div>

            {/* Chi tiết khấu trừ cọc */}
            <div className="pt-2 border-t border-cyan-200/80 flex items-center justify-between text-xs">
              <span className="text-slate-600">
                Chênh lệch vỏ:{" "}
                <strong className={netDrumDiff >= 0 ? "text-cyan-900" : "text-emerald-700"}>
                  {netDrumDiff > 0
                    ? `+${netDrumDiff} phuy mới`
                    : netDrumDiff < 0
                      ? `${netDrumDiff} vỏ trả thêm`
                      : "Đổi ngang 1:1"}
                </strong>
              </span>
              <span
                className={`font-mono font-bold text-xs ${
                  drumDepositDifference < 0 ? "text-emerald-700" : "text-cyan-900"
                }`}
              >
                {drumDepositDifference < 0
                  ? `Khấu trừ cọc: -${vndFormatter.format(Math.abs(drumDepositDifference))}`
                  : drumDepositDifference > 0
                    ? `Thêm cọc: +${vndFormatter.format(drumDepositDifference)}`
                    : "Cọc vỏ: 0đ"}
              </span>
            </div>
          </div>

          {/* Bảng tổng kết số tiền phải thu thực tế */}
          <div className="space-y-1.5 rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Tiền hàng (dầu nhớt):</span>
              <span className="font-mono font-semibold">{vndFormatter.format(goodsTotal)}</span>
            </div>
            {drumDepositDifference !== 0 && (
              <div className="flex justify-between">
                <span
                  className={
                    drumDepositDifference < 0
                      ? "text-emerald-700 font-medium"
                      : "text-cyan-800 font-medium"
                  }
                >
                  {drumDepositDifference < 0
                    ? "Khấu trừ tiền cọc vỏ cũ thu về:"
                    : "Tiền cọc thêm phuy mới:"}
                </span>
                <span
                  className={`font-mono font-bold ${
                    drumDepositDifference < 0 ? "text-emerald-700" : "text-cyan-800"
                  }`}
                >
                  {drumDepositDifference < 0
                    ? `-${vndFormatter.format(Math.abs(drumDepositDifference))}`
                    : `+${vndFormatter.format(drumDepositDifference)}`}
                </span>
              </div>
            )}
            <div className="flex items-center justify-between border-t border-slate-200 pt-2 text-sm">
              <span className="font-bold text-slate-900">Số tiền phải thu (Thực thanh toán):</span>
              <span className="text-base sm:text-lg font-black text-amber-600 tabular-nums font-mono">
                {vndFormatter.format(totalPayable)}
              </span>
            </div>
          </div>

          {wouldExceed ? (
            <p role="alert" className="text-sm text-destructive font-semibold">
              Vượt hạn mức công nợ — không thể chốt đơn.
            </p>
          ) : null}
          {stockIssue ? (
            <p role="alert" className="text-sm text-destructive font-semibold">
              Một hoặc nhiều dòng vượt tồn kho hiện có.
            </p>
          ) : null}
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
          <Button
            type="button"
            disabled={pending || !canSubmit}
            onClick={handleSubmit}
          >
            {pending ? "Đang tạo..." : "Chốt đơn"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
