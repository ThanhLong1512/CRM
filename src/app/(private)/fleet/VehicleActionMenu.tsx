"use client";

import { useState, useTransition } from "react";
import {
  Droplets,
  Gauge,
  MoreHorizontal,
  Pencil,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import {
  deleteVehicle,
  recordOilChange,
  updateMeter,
  updateVehicle,
} from "@/app/(private)/fleet/actions";
import type { FleetVehicleDto } from "@/lib/data/fleet";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type FleetCustomerOption = { id: string; name: string };

type VehicleActionMenuProps = {
  vehicle: FleetVehicleDto;
  customers: FleetCustomerOption[];
  onChanged: () => void;
};

export function VehicleActionMenu({
  vehicle,
  customers,
  onChanged,
}: VehicleActionMenuProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [meterOpen, setMeterOpen] = useState(false);
  const [oilOpen, setOilOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [customerId, setCustomerId] = useState(vehicle.customerId);
  const [unit, setUnit] = useState<"KM" | "HOUR">(vehicle.unit);
  const [pending, startTransition] = useTransition();

  function handleEdit(formData: FormData) {
    startTransition(async () => {
      const result = await updateVehicle(vehicle.id, {
        customerId,
        plateNumber: String(formData.get("plateNumber") ?? ""),
        label: String(formData.get("label") ?? ""),
        unit,
        intervalValue: Number(formData.get("intervalValue") ?? 0),
        notes: String(formData.get("notes") ?? ""),
      });
      if (!result.success) {
        toast.error(result.error ?? result.message);
        return;
      }
      toast.success(result.message);
      setEditOpen(false);
      onChanged();
    });
  }

  function handleMeter(formData: FormData) {
    startTransition(async () => {
      const result = await updateMeter(
        vehicle.id,
        Number(formData.get("currentMeter") ?? 0),
      );
      if (!result.success) {
        toast.error(result.error ?? result.message);
        return;
      }
      toast.success(result.message);
      setMeterOpen(false);
      onChanged();
    });
  }

  function handleOil() {
    startTransition(async () => {
      const result = await recordOilChange(vehicle.id);
      if (!result.success) {
        toast.error(result.error ?? result.message);
        return;
      }
      toast.success(result.message);
      setOilOpen(false);
      onChanged();
    });
  }

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteVehicle(vehicle.id);
      if (!result.success) {
        toast.error(result.error ?? result.message);
        return;
      }
      toast.success(result.message);
      setDeleteOpen(false);
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
              aria-label="Thao tác xe"
            />
          }
        >
          <MoreHorizontal className="size-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-44">
          <DropdownMenuItem
            onClick={() => {
              setCustomerId(vehicle.customerId);
              setUnit(vehicle.unit);
              setEditOpen(true);
            }}
          >
            <Pencil className="size-4" />
            Sửa
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setMeterOpen(true)}>
            <Gauge className="size-4" />
            Cập nhật meter
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setOilOpen(true)}>
            <Droplets className="size-4" />
            Đã thay nhớt
          </DropdownMenuItem>
          <DropdownMenuItem
            variant="destructive"
            onClick={() => setDeleteOpen(true)}
          >
            <Trash2 className="size-4" />
            Xóa
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-md" showCloseButton>
          <DialogHeader>
            <DialogTitle>Sửa đầu xe</DialogTitle>
            <DialogDescription>{vehicle.plateNumber}</DialogDescription>
          </DialogHeader>
          <form
            key={`${vehicle.id}-edit`}
            action={handleEdit}
            className="grid gap-3"
          >
            <div className="grid gap-2">
              <Label>Khách FLEET</Label>
              <Select
                value={customerId}
                onValueChange={(v) => {
                  if (typeof v === "string") setCustomerId(v);
                }}
                disabled={pending}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
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
              <Label htmlFor={`plate-${vehicle.id}`}>Biển số</Label>
              <Input
                id={`plate-${vehicle.id}`}
                name="plateNumber"
                defaultValue={vehicle.plateNumber}
                required
                disabled={pending}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor={`label-${vehicle.id}`}>Nhãn</Label>
              <Input
                id={`label-${vehicle.id}`}
                name="label"
                defaultValue={vehicle.label ?? ""}
                disabled={pending}
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
                <Label htmlFor={`interval-${vehicle.id}`}>Chu kỳ</Label>
                <Input
                  id={`interval-${vehicle.id}`}
                  name="intervalValue"
                  type="number"
                  min={1}
                  defaultValue={vehicle.intervalValue}
                  required
                  disabled={pending}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor={`notes-${vehicle.id}`}>Ghi chú</Label>
              <Input
                id={`notes-${vehicle.id}`}
                name="notes"
                defaultValue={vehicle.notes ?? ""}
                disabled={pending}
              />
            </div>
            <DialogFooter className="mx-0 mb-0 rounded-none border-0 bg-transparent p-0">
              <Button
                type="button"
                variant="outline"
                disabled={pending}
                onClick={() => setEditOpen(false)}
              >
                Hủy
              </Button>
              <Button type="submit" disabled={pending}>
                {pending ? "Đang lưu..." : "Cập nhật"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={meterOpen} onOpenChange={setMeterOpen}>
        <DialogContent className="sm:max-w-sm" showCloseButton>
          <DialogHeader>
            <DialogTitle>Cập nhật meter</DialogTitle>
            <DialogDescription>
              Hiện tại: {vehicle.currentMeter.toLocaleString("vi-VN")}{" "}
              {vehicle.unit === "KM" ? "km" : "giờ"}
            </DialogDescription>
          </DialogHeader>
          <form action={handleMeter} className="grid gap-3">
            <div className="grid gap-2">
              <Label htmlFor={`meter-${vehicle.id}`}>Meter mới</Label>
              <Input
                id={`meter-${vehicle.id}`}
                name="currentMeter"
                type="number"
                min={vehicle.lastServiceMeter}
                defaultValue={vehicle.currentMeter}
                required
                disabled={pending}
              />
            </div>
            <DialogFooter className="mx-0 mb-0 rounded-none border-0 bg-transparent p-0">
              <Button
                type="button"
                variant="outline"
                disabled={pending}
                onClick={() => setMeterOpen(false)}
              >
                Hủy
              </Button>
              <Button type="submit" disabled={pending}>
                {pending ? "Đang lưu..." : "Lưu meter"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={oilOpen} onOpenChange={setOilOpen}>
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Ghi nhận đã thay nhớt?</AlertDialogTitle>
            <AlertDialogDescription>
              Đặt meter lần thay = {vehicle.currentMeter.toLocaleString("vi-VN")}{" "}
              ({vehicle.unit === "KM" ? "km" : "giờ"}). Đèn cảnh báo sẽ được
              tính lại từ chu kỳ mới.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>Hủy</AlertDialogCancel>
            <AlertDialogAction disabled={pending} onClick={handleOil}>
              {pending ? "Đang lưu..." : "Xác nhận"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa đầu xe?</AlertDialogTitle>
            <AlertDialogDescription>
              Xóa <strong>{vehicle.plateNumber}</strong>. Không hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>Hủy</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={pending}
              onClick={handleDelete}
            >
              {pending ? "Đang xóa..." : "Xóa"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
