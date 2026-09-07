"use client";

import { useState, useTransition } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  deleteProduct,
  updateProduct,
} from "@/app/(private)/san-pham/actions";
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

export type ProductRow = {
  id: string;
  sku: string;
  name: string;
  viscosity: string | null;
  standard: string | null;
  volume: string | null;
  unitPrice: number;
  stock: number;
  isDrum: boolean;
};

type ProductActionMenuProps = {
  product: ProductRow;
};

export function ProductActionMenu({ product }: ProductActionMenuProps) {
  const queryClient = useQueryClient();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleUpdate(formData: FormData) {
    startTransition(async () => {
      const result = await updateProduct(product.id, formData);
      if (!result.success) {
        toast.error(result.error ?? result.message);
        return;
      }
      toast.success(result.message);
      await queryClient.invalidateQueries({ queryKey: PRODUCTS_QUERY_KEY });
      setEditOpen(false);
    });
  }

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteProduct(product.id);
      if (!result.success) {
        toast.error(result.error ?? result.message);
        return;
      }
      toast.success(result.message);
      await queryClient.invalidateQueries({ queryKey: PRODUCTS_QUERY_KEY });
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
              aria-label="Thao tác sản phẩm"
            />
          }
        >
          <MoreHorizontal className="size-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-36">
          <DropdownMenuItem onClick={() => setEditOpen(true)}>
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
            <DialogTitle>Sửa sản phẩm</DialogTitle>
            <DialogDescription>
              Cập nhật thông tin cho mã {product.sku}.
            </DialogDescription>
          </DialogHeader>

          <form key={product.id} action={handleUpdate} className="grid gap-3">
            <div className="grid gap-2">
              <Label htmlFor={`edit-code-${product.id}`}>Mã SP</Label>
              <Input
                id={`edit-code-${product.id}`}
                name="code"
                defaultValue={product.sku}
                required
                disabled={pending}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor={`edit-name-${product.id}`}>Tên SP</Label>
              <Input
                id={`edit-name-${product.id}`}
                name="name"
                defaultValue={product.name}
                required
                disabled={pending}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label htmlFor={`edit-viscosity-${product.id}`}>Viscosity</Label>
                <Input
                  id={`edit-viscosity-${product.id}`}
                  name="viscosity"
                  defaultValue={product.viscosity ?? ""}
                  disabled={pending}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor={`edit-standard-${product.id}`}>Standard</Label>
                <Input
                  id={`edit-standard-${product.id}`}
                  name="standard"
                  defaultValue={product.standard ?? ""}
                  disabled={pending}
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="grid gap-2">
                <Label htmlFor={`edit-volume-${product.id}`}>Dung tích (L)</Label>
                <Input
                  id={`edit-volume-${product.id}`}
                  name="volume"
                  type="number"
                  min={0}
                  step="0.1"
                  defaultValue={product.volume ?? ""}
                  disabled={pending}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor={`edit-price-${product.id}`}>Giá bán</Label>
                <Input
                  id={`edit-price-${product.id}`}
                  name="price"
                  type="number"
                  min={0}
                  step={1000}
                  defaultValue={product.unitPrice}
                  required
                  disabled={pending}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor={`edit-stock-${product.id}`}>Tồn kho</Label>
                <Input
                  id={`edit-stock-${product.id}`}
                  name="stock"
                  type="number"
                  min={0}
                  step={1}
                  defaultValue={product.stock}
                  disabled={pending}
                />
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="isDrum"
                value="true"
                defaultChecked={product.isDrum}
                disabled={pending}
                className="size-4 rounded border border-input"
              />
              Sản phẩm có vỏ phuy (theo dõi thu/trả)
            </label>

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
            <AlertDialogTitle>Xóa sản phẩm?</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn sắp xóa <strong>{product.name}</strong> ({product.sku}). Thao
              tác này không hoàn tác.
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
