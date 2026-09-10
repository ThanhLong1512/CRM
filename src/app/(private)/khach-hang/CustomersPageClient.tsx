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
import { PageHero, StatCard } from "@/components/features/PageHero";
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

import { vndFormatter } from "@/lib/formatMoney";

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
      <PageHero
        icon={Users}
        title="Khách hàng & công nợ"
        description={
          <>
            Quản lý garage và đội xe
            {isFetching && !isLoading ? " · Đang đồng bộ..." : ""}
          </>
        }
        actions={<CreateCustomerButton />}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Tổng khách hàng"
          value={totalCustomers}
          hint="Trong hệ thống"
          icon={Users}
          tone="sky"
        />
        <StatCard
          label="Garage"
          value={garageCount}
          hint="Đại lý / tiệm sửa xe"
          icon={Warehouse}
          tone="emerald"
        />
        <StatCard
          label="Đội xe"
          value={fleetCount}
          hint="Khách hàng FLEET"
          icon={Truck}
          tone="violet"
        />
        <StatCard
          label="Gần hạn mức"
          value={nearLimitCount}
          hint="Dư nợ ≥ 80% hạn mức"
          icon={AlertTriangle}
          tone="rose"
        />
      </div>

      <Card className="rounded-2xl border border-slate-200 bg-white shadow-xs">
        <CardHeader className="pb-3">
          <CardTitle className="font-display text-base font-semibold text-slate-900">
            Bộ lọc
          </CardTitle>
          <p className="text-sm text-slate-500">
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

      <p className="text-sm text-slate-500">
        Hiển thị {filtered.length} trên tổng số {totalCustomers} khách hàng.
      </p>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
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
