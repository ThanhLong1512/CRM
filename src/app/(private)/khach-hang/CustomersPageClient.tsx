"use client";

import { useDeferredValue, useMemo, useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  Search,
  Users,
  Warehouse,
  Truck,
} from "lucide-react";
import { CreateCustomerButton } from "@/app/(private)/khach-hang/CreateCustomerButton";
import { CustomerActionMenu } from "@/app/(private)/khach-hang/CustomerActionMenu";
import {
  CUSTOMERS_QUERY_KEY,
  fetchCustomers,
  filterCustomers,
  isNearCreditLimit,
  type CreditStatusFilter,
  type CustomerTypeFilter,
} from "@/app/(private)/khach-hang/customer-query";
import { MasterListSkeleton } from "@/components/features/MasterListSkeleton";
import { Badge } from "@/components/ui/badge";
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

export function CustomersPageClient() {
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const [type, setType] = useState<CustomerTypeFilter>("all");
  const [credit, setCredit] = useState<CreditStatusFilter>("all");

  const { data: customers = [], isFetching, isLoading, isError } = useQuery({
    queryKey: CUSTOMERS_QUERY_KEY,
    queryFn: fetchCustomers,
    placeholderData: keepPreviousData,
  });

  const filtered = useMemo(
    () =>
      filterCustomers(customers, {
        query: deferredQuery,
        type,
        credit,
      }),
    [customers, deferredQuery, type, credit],
  );

  const totalCustomers = customers.length;
  const garageCount = customers.filter((c) => c.type === "GARAGE").length;
  const fleetCount = customers.filter((c) => c.type === "FLEET").length;
  const nearLimitCount = customers.filter((c) =>
    isNearCreditLimit(c.currentDebt, c.creditLimit),
  ).length;
  const filteredDebt = filtered.reduce((sum, c) => sum + c.currentDebt, 0);
  const hasFilters =
    deferredQuery.trim().length > 0 || type !== "all" || credit !== "all";

  if (isLoading && customers.length === 0) {
    return <MasterListSkeleton statCount={4} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Khách hàng</h1>
          <p className="text-sm text-muted-foreground">
            Quản lý garage và đội xe
            {isFetching && !isLoading ? " · Đang đồng bộ..." : ""}
          </p>
        </div>
        <CreateCustomerButton />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="bg-background shadow-none ring-1 ring-border/60">
          <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Tổng khách hàng
            </CardTitle>
            <Users className="size-4 text-sky-600" aria-hidden />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold tracking-tight text-sky-700">
              {totalCustomers}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Khách hàng trong hệ thống
            </p>
          </CardContent>
        </Card>

        <Card className="bg-background shadow-none ring-1 ring-border/60">
          <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Garage
            </CardTitle>
            <Warehouse className="size-4 text-sky-600" aria-hidden />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold tracking-tight text-sky-700">
              {garageCount}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Đại lý / tiệm sửa xe
            </p>
          </CardContent>
        </Card>

        <Card className="bg-background shadow-none ring-1 ring-border/60">
          <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Đội xe
            </CardTitle>
            <Truck className="size-4 text-sky-600" aria-hidden />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold tracking-tight text-sky-700">
              {fleetCount}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Khách hàng FLEET
            </p>
          </CardContent>
        </Card>

        <Card className="bg-background shadow-none ring-1 ring-border/60">
          <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Gần hạn mức
            </CardTitle>
            <AlertTriangle className="size-4 text-amber-600" aria-hidden />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold tracking-tight text-amber-700">
              {nearLimitCount}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Dư nợ ≥ 80% hạn mức
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-background shadow-none ring-1 ring-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Bộ lọc</CardTitle>
          <p className="text-sm text-muted-foreground">
            Tìm kiếm khách hàng và lọc theo phân loại, trạng thái công nợ
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
                placeholder="Tìm theo tên, SĐT, địa chỉ..."
                className="h-10 pl-9"
              />
            </div>
            <Select
              value={type}
              onValueChange={(value) => {
                if (value === "all" || value === "GARAGE" || value === "FLEET") {
                  setType(value);
                }
              }}
            >
              <SelectTrigger className="h-10 w-full lg:w-48">
                <SelectValue placeholder="Tất cả phân loại" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả phân loại</SelectItem>
                <SelectItem value="GARAGE">GARAGE</SelectItem>
                <SelectItem value="FLEET">FLEET</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={credit}
              onValueChange={(value) => {
                if (
                  value === "all" ||
                  value === "near_limit" ||
                  value === "ok"
                ) {
                  setCredit(value);
                }
              }}
            >
              <SelectTrigger className="h-10 w-full lg:w-52">
                <SelectValue placeholder="Tất cả công nợ" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả công nợ</SelectItem>
                <SelectItem value="near_limit">Gần chạm hạn mức</SelectItem>
                <SelectItem value="ok">Trong hạn mức</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <p className="text-sm text-muted-foreground">
        Hiển thị {filtered.length} trên tổng số {totalCustomers} khách hàng.
      </p>

      <div className="rounded-lg border border-border bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tên Khách Hàng</TableHead>
              <TableHead>Số Điện Thoại</TableHead>
              <TableHead>Địa Chỉ</TableHead>
              <TableHead>Phân Loại</TableHead>
              <TableHead className="text-right">Hạn mức</TableHead>
              <TableHead className="text-right">Dư nợ</TableHead>
              <TableHead className="w-12">
                <span className="sr-only">Hành động</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={`sk-${i}`}>
                  {Array.from({ length: 7 }).map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-5 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : isError ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="h-24 text-center text-destructive"
                >
                  Không tải được dữ liệu. Thử tải lại trang.
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="h-24 text-center text-muted-foreground"
                >
                  {hasFilters
                    ? "Không tìm thấy khách hàng nào."
                    : "Chưa có khách hàng. Bấm “Thêm Khách Hàng” để tạo mới."}
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((customer) => {
                const nearLimit = isNearCreditLimit(
                  customer.currentDebt,
                  customer.creditLimit,
                );

                return (
                  <TableRow key={customer.id}>
                    <TableCell className="font-medium">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="max-w-[220px] whitespace-normal">
                          {customer.name}
                        </span>
                        {nearLimit ? (
                          <Badge variant="destructive">Gần chạm hạn mức</Badge>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {customer.phone || "—"}
                    </TableCell>
                    <TableCell className="max-w-[240px] whitespace-normal text-muted-foreground">
                      {customer.address || "—"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          customer.type === "FLEET" ? "default" : "secondary"
                        }
                      >
                        {customer.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {vndFormatter.format(customer.creditLimit)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {vndFormatter.format(customer.currentDebt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <CustomerActionMenu customer={customer} />
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell colSpan={5} className="font-medium">
                Tổng dư nợ (theo bộ lọc)
              </TableCell>
              <TableCell className="text-right font-semibold tabular-nums">
                {vndFormatter.format(filteredDebt)}
              </TableCell>
              <TableCell />
            </TableRow>
          </TableFooter>
        </Table>
      </div>
    </div>
  );
}
