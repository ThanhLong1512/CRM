"use client";

import { useState, useTransition } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { createCustomer } from "@/app/(private)/khach-hang/actions";
import { CUSTOMERS_QUERY_KEY } from "@/app/(private)/khach-hang/customer-query";
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

export function CreateCustomerButton() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<"GARAGE" | "FLEET">("GARAGE");
  const [pending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    formData.set("type", type);

    startTransition(async () => {
      const result = await createCustomer(formData);
      if (!result.success) {
        toast.error(result.error ?? result.message);
        return;
      }
      toast.success(result.message);
      await queryClient.invalidateQueries({ queryKey: CUSTOMERS_QUERY_KEY });
      setOpen(false);
      setType("GARAGE");
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) {
          setType("GARAGE");
        }
      }}
    >
      <DialogTrigger
        render={<Button type="button" className="gap-1.5 self-start sm:self-auto" />}
      >
        <Plus className="size-4" aria-hidden />
        Thêm Khách Hàng
      </DialogTrigger>
      <DialogContent className="sm:max-w-md" showCloseButton>
        <DialogHeader>
          <DialogTitle>Thêm khách hàng</DialogTitle>
          <DialogDescription>
            Nhập thông tin garage / đội xe để thêm vào CRM.
          </DialogDescription>
        </DialogHeader>

        <form action={handleSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="customer-name">Tên khách hàng</Label>
            <Input
              id="customer-name"
              name="name"
              placeholder="Garage ABC"
              required
              disabled={pending}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="customer-phone">Số điện thoại</Label>
            <Input
              id="customer-phone"
              name="phone"
              type="tel"
              placeholder="0901234567"
              disabled={pending}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="customer-address">Địa chỉ</Label>
            <Input
              id="customer-address"
              name="address"
              placeholder="Quận 1, TP.HCM"
              disabled={pending}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="customer-type">Phân loại</Label>
            <input type="hidden" name="type" value={type} />
            <Select
              value={type}
              onValueChange={(value) => {
                if (value === "GARAGE" || value === "FLEET") setType(value);
              }}
              disabled={pending}
            >
              <SelectTrigger id="customer-type" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="GARAGE">GARAGE</SelectItem>
                <SelectItem value="FLEET">FLEET</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="customer-credit">Hạn mức công nợ (VND)</Label>
            <Input
              id="customer-credit"
              name="creditLimit"
              type="number"
              min={0}
              step={1000}
              defaultValue={0}
              disabled={pending}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="customer-lat">Vĩ độ (lat)</Label>
              <Input
                id="customer-lat"
                name="lat"
                type="number"
                step="any"
                placeholder="10.7769"
                disabled={pending}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="customer-lng">Kinh độ (lng)</Label>
              <Input
                id="customer-lng"
                name="lng"
                type="number"
                step="any"
                placeholder="106.7009"
                disabled={pending}
              />
            </div>
          </div>

          <p className="text-xs text-muted-foreground rounded-lg border border-dashed px-3 py-2">
            Sau khi tạo, mở Sửa khách hàng để thêm các ngày ghé cụ thể trên lịch.
          </p>

          <DialogFooter className="mx-0 mb-0 rounded-none border-0 bg-transparent p-0">
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              onClick={() => setOpen(false)}
            >
              Hủy
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Đang lưu..." : "Lưu khách hàng"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
