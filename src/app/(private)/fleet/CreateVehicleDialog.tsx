"use client";

import { useState, useTransition } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { createVehicle } from "@/app/(private)/fleet/actions";
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

type FleetCustomerOption = {
  id: string;
  name: string;
};

type CreateVehicleDialogProps = {
  customers: FleetCustomerOption[];
  onChanged: () => void;
};

export function CreateVehicleDialog({
  customers,
  onChanged,
}: CreateVehicleDialogProps) {
  const [open, setOpen] = useState(false);
  const [customerId, setCustomerId] = useState(customers[0]?.id ?? "");
  const [unit, setUnit] = useState<"KM" | "HOUR">("KM");
  const [pending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await createVehicle({
        customerId,
        plateNumber: String(formData.get("plateNumber") ?? ""),
        label: String(formData.get("label") ?? ""),
        unit,
        currentMeter: Number(formData.get("currentMeter") ?? 0),
        lastServiceMeter: Number(formData.get("lastServiceMeter") ?? 0),
        intervalValue: Number(formData.get("intervalValue") ?? 0),
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
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button type="button" className="gap-1.5 self-start sm:self-auto" />
        }
      >
        <Plus className="size-4" aria-hidden />
        Thêm đầu xe
      </DialogTrigger>
      <DialogContent className="sm:max-w-md" showCloseButton>
        <DialogHeader>
          <DialogTitle>Thêm đầu xe</DialogTitle>
          <DialogDescription>
            Gắn xe/máy với khách FLEET và thiết lập chu kỳ thay nhớt.
          </DialogDescription>
        </DialogHeader>
        <form action={handleSubmit} className="grid gap-3">
          <div className="grid gap-2">
            <Label>Khách FLEET</Label>
            <Select
              value={customerId || undefined}
              onValueChange={(v) => {
                if (typeof v === "string") setCustomerId(v);
              }}
              disabled={pending || customers.length === 0}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Chọn khách hàng" />
              </SelectTrigger>
              <SelectContent>
                {customers.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="plateNumber">Biển số / mã máy</Label>
            <Input
              id="plateNumber"
              name="plateNumber"
              required
              disabled={pending}
              placeholder="51C-123.45"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="label">Nhãn</Label>
            <Input
              id="label"
              name="label"
              disabled={pending}
              placeholder="Xe ben 01"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label>Đơn vị</Label>
              <Select
                value={unit}
                onValueChange={(v) => {
                  if (v === "KM" || v === "HOUR") setUnit(v);
                }}
                disabled={pending}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="KM">Km</SelectItem>
                  <SelectItem value="HOUR">Giờ máy</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="intervalValue">Chu kỳ thay</Label>
              <Input
                id="intervalValue"
                name="intervalValue"
                type="number"
                min={1}
                defaultValue={unit === "KM" ? 10000 : 500}
                required
                disabled={pending}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="currentMeter">Meter hiện tại</Label>
              <Input
                id="currentMeter"
                name="currentMeter"
                type="number"
                min={0}
                defaultValue={0}
                required
                disabled={pending}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="lastServiceMeter">Meter lần thay</Label>
              <Input
                id="lastServiceMeter"
                name="lastServiceMeter"
                type="number"
                min={0}
                defaultValue={0}
                required
                disabled={pending}
              />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="notes">Ghi chú</Label>
            <Input id="notes" name="notes" disabled={pending} />
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
              {pending ? "Đang lưu..." : "Lưu"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
