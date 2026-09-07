"use client";

import { useState, useTransition } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { createProduct } from "@/app/(private)/san-pham/actions";
import { PRODUCTS_QUERY_KEY } from "@/app/(private)/san-pham/product-query";
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

export function CreateProductDialog() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await createProduct(formData);
      if (!result.success) {
        toast.error(result.error ?? result.message);
        return;
      }
      toast.success(result.message);
      await queryClient.invalidateQueries({ queryKey: PRODUCTS_QUERY_KEY });
      setOpen(false);
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
        Thêm Sản phẩm
      </DialogTrigger>
      <DialogContent className="sm:max-w-md" showCloseButton>
        <DialogHeader>
          <DialogTitle>Thêm sản phẩm</DialogTitle>
          <DialogDescription>
            Nhập thông tin dầu nhớt / phụ gia mới vào danh mục.
          </DialogDescription>
        </DialogHeader>

        <form action={handleSubmit} className="grid gap-3">
          <div className="grid gap-2">
            <Label htmlFor="create-code">Mã SP</Label>
            <Input
              id="create-code"
              name="code"
              placeholder="DN-5W30-4L"
              required
              disabled={pending}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="create-name">Tên SP</Label>
            <Input
              id="create-name"
              name="name"
              placeholder="Dầu nhớt 5W-30"
              required
              disabled={pending}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="create-viscosity">Viscosity</Label>
              <Input
                id="create-viscosity"
                name="viscosity"
                placeholder="5W-30"
                disabled={pending}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="create-standard">Standard</Label>
              <Input
                id="create-standard"
                name="standard"
                placeholder="API SP"
                disabled={pending}
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="create-volume">Dung tích (L)</Label>
              <Input
                id="create-volume"
                name="volume"
                type="number"
                min={0}
                step="0.1"
                defaultValue={4}
                disabled={pending}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="create-price">Giá bán</Label>
              <Input
                id="create-price"
                name="price"
                type="number"
                min={0}
                step={1000}
                defaultValue={0}
                required
                disabled={pending}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="create-stock">Tồn kho</Label>
              <Input
                id="create-stock"
                name="stock"
                type="number"
                min={0}
                step={1}
                defaultValue={0}
                disabled={pending}
              />
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="isDrum"
              value="true"
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
              onClick={() => setOpen(false)}
            >
              Hủy
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Đang lưu..." : "Lưu sản phẩm"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
