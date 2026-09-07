"use client";

import { useDeferredValue, useMemo, useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Box, Package, Search, TrendingUp } from "lucide-react";
import { CreateProductDialog } from "@/app/(private)/san-pham/CreateProductDialog";
import { ProductActionMenu } from "@/app/(private)/san-pham/ProductActionMenu";
import {
  filterProducts,
  fetchProducts,
  PRODUCTS_QUERY_KEY,
  type StockStatusFilter,
} from "@/app/(private)/san-pham/product-query";
import { MasterListSkeleton } from "@/components/features/MasterListSkeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const vndFormatter = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
});

function formatClassification(
  viscosity: string | null,
  standard: string | null,
): string {
  const parts = [viscosity, standard].filter(Boolean);
  return parts.length > 0 ? parts.join(" · ") : "—";
}

function formatVolume(volume: string | null): string {
  if (!volume) return "—";
  return `${volume} L`;
}

export function ProductsPageClient() {
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const [status, setStatus] = useState<StockStatusFilter>("all");
  const [category, setCategory] = useState("all");

  const { data: products = [], isFetching, isLoading, isError } = useQuery({
    queryKey: PRODUCTS_QUERY_KEY,
    queryFn: fetchProducts,
    placeholderData: keepPreviousData,
  });

  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const product of products) {
      if (product.viscosity) set.add(product.viscosity);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [products]);

  const filtered = useMemo(
    () =>
      filterProducts(products, {
        query: deferredQuery,
        status,
        category,
      }),
    [products, deferredQuery, status, category],
  );

  const totalProducts = products.length;
  const activeCount = products.filter((p) => p.stock > 0).length;
  const inStockCount = activeCount;
  const filteredStock = filtered.reduce((sum, p) => sum + p.stock, 0);
  const hasFilters =
    deferredQuery.trim().length > 0 || status !== "all" || category !== "all";

  if (isLoading && products.length === 0) {
    return <MasterListSkeleton statCount={3} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Sản phẩm</h1>
          <p className="text-sm text-muted-foreground">
            Danh mục dầu nhớt và phụ gia
            {isFetching && !isLoading ? " · Đang đồng bộ..." : ""}
          </p>
        </div>
        <CreateProductDialog />
      </div>

      {/* Summary cards — UI giống mock */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="bg-background shadow-none ring-1 ring-border/60">
          <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Tổng sản phẩm
            </CardTitle>
            <Package className="size-4 text-sky-600" aria-hidden />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold tracking-tight text-sky-700">
              {totalProducts}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Sản phẩm trong hệ thống
            </p>
          </CardContent>
        </Card>

        <Card className="bg-background shadow-none ring-1 ring-border/60">
          <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Đang hoạt động
            </CardTitle>
            <TrendingUp className="size-4 text-sky-600" aria-hidden />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold tracking-tight text-sky-700">
              {activeCount}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Sản phẩm đang hoạt động
            </p>
          </CardContent>
        </Card>

        <Card className="bg-background shadow-none ring-1 ring-border/60">
          <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Còn hàng
            </CardTitle>
            <Box className="size-4 text-sky-600" aria-hidden />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold tracking-tight text-sky-700">
              {inStockCount}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Sản phẩm còn hàng
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filter panel */}
      <Card className="bg-background shadow-none ring-1 ring-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Bộ lọc</CardTitle>
          <p className="text-sm text-muted-foreground">
            Tìm kiếm sản phẩm và lọc theo trạng thái, danh mục
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3 lg:flex-row">
            <div className="relative min-w-0 flex-1">
              <Search
                className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Tìm kiếm theo tên, SKU, độ nhớt, tiêu chuẩn..."
                className="h-10 pl-9"
              />
            </div>
            <Select
              value={status}
              onValueChange={(value) => {
                if (
                  value === "all" ||
                  value === "in_stock" ||
                  value === "out_of_stock"
                ) {
                  setStatus(value);
                }
              }}
            >
              <SelectTrigger className="h-10 w-full lg:w-48">
                <SelectValue placeholder="Tất cả trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả trạng thái</SelectItem>
                <SelectItem value="in_stock">Còn hàng</SelectItem>
                <SelectItem value="out_of_stock">Hết hàng</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={category}
              onValueChange={(value) => {
                if (typeof value === "string") setCategory(value);
              }}
            >
              <SelectTrigger className="h-10 w-full lg:w-48">
                <SelectValue placeholder="Tất cả danh mục" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả danh mục</SelectItem>
                {categories.map((item) => (
                  <SelectItem key={item} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <p className="text-sm text-muted-foreground">
        Hiển thị {filtered.length} trên tổng số {totalProducts} sản phẩm.
      </p>

      <div className="rounded-lg border border-border bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Mã SP</TableHead>
              <TableHead>Tên SP</TableHead>
              <TableHead>Phân loại</TableHead>
              <TableHead>Dung tích</TableHead>
              <TableHead>Vỏ phuy</TableHead>
              <TableHead className="text-right">Giá bán</TableHead>
              <TableHead className="text-right">Tồn kho</TableHead>
              <TableHead className="w-12">
                <span className="sr-only">Hành động</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={`sk-${i}`}>
                  {Array.from({ length: 8 }).map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-5 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : isError ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="h-24 text-center text-destructive"
                >
                  Không tải được dữ liệu. Thử tải lại trang.
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="h-24 text-center text-muted-foreground"
                >
                  {hasFilters
                    ? "Không tìm thấy sản phẩm nào."
                    : "Chưa có sản phẩm nào. Bấm “Thêm Sản phẩm” để tạo mới."}
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="font-mono text-xs font-medium">
                    {product.sku}
                  </TableCell>
                  <TableCell className="max-w-[240px] truncate font-medium whitespace-normal">
                    {product.name}
                  </TableCell>
                  <TableCell className="text-muted-foreground whitespace-normal">
                    {formatClassification(product.viscosity, product.standard)}
                  </TableCell>
                  <TableCell>{formatVolume(product.volume)}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {product.isDrum ? "Có" : "—"}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {vndFormatter.format(product.unitPrice)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {product.stock}
                  </TableCell>
                  <TableCell className="text-right">
                    <ProductActionMenu product={product} />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell colSpan={6} className="font-medium">
                Tổng tồn kho (theo bộ lọc)
              </TableCell>
              <TableCell className="text-right font-semibold tabular-nums">
                {filteredStock}
              </TableCell>
              <TableCell />
            </TableRow>
          </TableFooter>
        </Table>
      </div>
    </div>
  );
}
