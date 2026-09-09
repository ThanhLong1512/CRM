"use client";

import { useState, useTransition } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  deleteCustomer,
  updateCustomer,
} from "@/app/(private)/khach-hang/actions";
import {
  VisitDatesEditor,
  type VisitPlanItem,
} from "@/components/customers/VisitDatesEditor";
import {
  CUSTOMERS_QUERY_KEY,
  type CustomerDto,
} from "@/app/(private)/khach-hang/customer-query";
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

type CustomerActionMenuProps = {
  customer: CustomerDto;
};

export function CustomerActionMenu({ customer }: CustomerActionMenuProps) {
  const queryClient = useQueryClient();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [type, setType] = useState<"GARAGE" | "FLEET">(customer.type);
  const [visitPlans, setVisitPlans] = useState<VisitPlanItem[]>(
    () => customer.visitPlans ?? [],
  );
  const [pending, startTransition] = useTransition();

  function handleUpdate(formData: FormData) {
    formData.set("type", type);
    startTransition(async () => {
      const result = await updateCustomer(customer.id, formData);
      if (!result.success) {
        toast.error(result.error ?? result.message);
        return;
      }
      toast.success(result.message);
      await queryClient.invalidateQueries({ queryKey: CUSTOMERS_QUERY_KEY });
      setEditOpen(false);
    });
  }

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteCustomer(customer.id);
      if (!result.success) {
        toast.error(result.error ?? result.message);
        return;
      }
      toast.success(result.message);
      await queryClient.invalidateQueries({ queryKey: CUSTOMERS_QUERY_KEY });
      setDeleteOpen(false);
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
              aria-label="Thao tác khách hàng"
            />
          }
        >
          <MoreHorizontal className="size-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-36">
          <DropdownMenuItem
            onClick={() => {
              setType(customer.type);
              setVisitPlans(customer.visitPlans ?? []);
              setEditOpen(true);
            }}
          >
            <Pencil className="size-4" />
            Sửa
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
            <DialogTitle>Sửa khách hàng</DialogTitle>
            <DialogDescription>
              Cập nhật thông tin cho {customer.name}.
            </DialogDescription>
          </DialogHeader>

          <form
            key={`${customer.id}-${editOpen}`}
            action={handleUpdate}
            className="grid gap-3"
          >
            <div className="grid gap-2">
              <Label htmlFor={`edit-name-${customer.id}`}>Tên khách hàng</Label>
              <Input
                id={`edit-name-${customer.id}`}
                name="name"
                defaultValue={customer.name}
                required
                disabled={pending}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor={`edit-phone-${customer.id}`}>Số điện thoại</Label>
              <Input
                id={`edit-phone-${customer.id}`}
                name="phone"
                type="tel"
                defaultValue={customer.phone ?? ""}
                disabled={pending}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor={`edit-address-${customer.id}`}>Địa chỉ</Label>
              <Input
                id={`edit-address-${customer.id}`}
                name="address"
                defaultValue={customer.address ?? ""}
                disabled={pending}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor={`edit-type-${customer.id}`}>Phân loại</Label>
              <input type="hidden" name="type" value={type} />
              <Select
                value={type}
                onValueChange={(value) => {
                  if (value === "GARAGE" || value === "FLEET") setType(value);
                }}
                disabled={pending}
              >
                <SelectTrigger id={`edit-type-${customer.id}`} className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GARAGE">GARAGE</SelectItem>
                  <SelectItem value="FLEET">FLEET</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor={`edit-credit-${customer.id}`}>
                Hạn mức công nợ (VND)
              </Label>
              <Input
                id={`edit-credit-${customer.id}`}
                name="creditLimit"
                type="number"
                min={0}
                step={1000}
                defaultValue={customer.creditLimit}
                disabled={pending}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label htmlFor={`edit-lat-${customer.id}`}>Vĩ độ (lat)</Label>
                <Input
                  id={`edit-lat-${customer.id}`}
                  name="lat"
                  type="number"
                  step="any"
                  defaultValue={customer.lat ?? ""}
                  disabled={pending}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor={`edit-lng-${customer.id}`}>Kinh độ (lng)</Label>
                <Input
                  id={`edit-lng-${customer.id}`}
                  name="lng"
                  type="number"
                  step="any"
                  defaultValue={customer.lng ?? ""}
                  disabled={pending}
                />
              </div>
            </div>

            <VisitDatesEditor
              customerId={customer.id}
              plans={visitPlans}
              onPlansChange={(plans) => {
                setVisitPlans(plans);
                void queryClient.invalidateQueries({ queryKey: CUSTOMERS_QUERY_KEY });
              }}
              disabled={pending}
            />

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

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa khách hàng?</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn sắp xóa <strong>{customer.name}</strong>. Thao tác này không
              hoàn tác.
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
