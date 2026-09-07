"use client";

import { useDeferredValue, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Cylinder,
  Search,
  Users,
} from "lucide-react";
import { DrumActionMenu } from "@/app/(private)/vo-phuy/DrumActionMenu";
import { IssueDrumDialog } from "@/app/(private)/vo-phuy/IssueDrumDialog";
import type {
  DrumBalanceDto,
  DrumCustomerOption,
  DrumProductOption,
  DrumStats,
} from "@/lib/data/drums";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type HoldingFilter = "all" | "holding" | "zero";

type VoPhuyPageClientProps = {
  balances: DrumBalanceDto[];
  customers: DrumCustomerOption[];
  products: DrumProductOption[];
  stats: DrumStats;
};

function typeLabel(type: "GARAGE" | "FLEET"): string {
  return type === "FLEET" ? "Đội xe" : "Garage";
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

function lastTxnLabel(
  type: DrumBalanceDto["lastTxnType"],
): string | null {
  if (!type) return null;
  if (type === "ISSUE") return "Xuất";
  if (type === "RETURN") return "Thu";
  return "Đ.chỉnh";
}

export function VoPhuyPageClient({
  balances,
  customers,
  products,
  stats,
}: VoPhuyPageClientProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const [holding, setHolding] = useState<HoldingFilter>("holding");

  const filtered = useMemo(() => {
    const q = deferredQuery.trim().toLowerCase();
    return balances.filter((row) => {
      if (holding === "holding" && row.outstandingDrums <= 0) return false;
      if (holding === "zero" && row.outstandingDrums !== 0) return false;
      if (!q) return true;
      const haystack = [
        row.customerName,
        row.customerPhone ?? "",
        row.customerType,
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [balances, deferredQuery, holding]);

  const hasFilters =
    deferredQuery.trim().length > 0 || holding !== "holding";

  function refresh() {
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            Quản lý vỏ phuy
          </h1>
          <p className="text-sm text-muted-foreground">
            Theo dõi số lượng vỏ xuất đi và thu hồi theo từng khách hàng
          </p>
        </div>
        <IssueDrumDialog
          customers={customers}
          products={products}
          onChanged={refresh}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="bg-background shadow-none ring-1 ring-border/60">
          <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Vỏ đang ngoài
            </CardTitle>
            <Cylinder className="size-4 text-sky-600" aria-hidden />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold tracking-tight text-sky-700">
              {stats.totalOutstanding}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-background shadow-none ring-1 ring-border/60">
          <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              KH đang giữ
            </CardTitle>
            <Users className="size-4 text-amber-600" aria-hidden />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold tracking-tight text-amber-700">
              {stats.customersHolding}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-background shadow-none ring-1 ring-border/60">
          <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Tổng xuất
            </CardTitle>
            <ArrowUpFromLine className="size-4 text-red-600" aria-hidden />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold tracking-tight text-red-700">
              {stats.totalIssued}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-background shadow-none ring-1 ring-border/60">
          <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Tổng thu
            </CardTitle>
            <ArrowDownToLine className="size-4 text-emerald-600" aria-hidden />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold tracking-tight text-emerald-700">
              {stats.totalReturned}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-background shadow-none ring-1 ring-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Bộ lọc</CardTitle>
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
                placeholder="Tìm tên khách, SĐT..."
                className="h-10 pl-9"
              />
            </div>
            <Select
              value={holding}
              onValueChange={(v) => {
                if (v === "all" || v === "holding" || v === "zero") {
                  setHolding(v);
                }
              }}
            >
              <SelectTrigger className="h-10 w-full lg:w-52">
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="holding">Đang giữ vỏ</SelectItem>
                <SelectItem value="all">Tất cả khách</SelectItem>
                <SelectItem value="zero">Số dư = 0</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <p className="text-sm text-muted-foreground">
        Hiển thị {filtered.length} / {balances.length} khách hàng.
      </p>

      <div className="rounded-lg border border-border bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Khách hàng</TableHead>
              <TableHead>Loại</TableHead>
              <TableHead className="text-right">Đang giữ</TableHead>
              <TableHead>Giao dịch gần nhất</TableHead>
              <TableHead className="w-12">
                <span className="sr-only">Hành động</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {customers.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="h-24 text-center text-muted-foreground"
                >
                  Chưa có khách hàng. Tạo khách trước khi xuất vỏ.
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="h-24 text-center text-muted-foreground"
                >
                  {hasFilters
                    ? "Không tìm thấy khách phù hợp."
                    : "Chưa có vỏ đang ngoài. Bấm “Xuất vỏ phuy” để ghi nhận."}
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((row) => (
                <TableRow key={row.customerId}>
                  <TableCell className="font-medium">
                    <div className="flex flex-col gap-0.5">
                      <span>{row.customerName}</span>
                      {row.customerPhone ? (
                        <span className="text-xs text-muted-foreground">
                          {row.customerPhone}
                        </span>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {typeLabel(row.customerType)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right tabular-nums font-semibold">
                    {row.outstandingDrums}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {row.lastTxnAt ? (
                      <span>
                        {lastTxnLabel(row.lastTxnType)} ·{" "}
                        {formatDate(row.lastTxnAt)}
                      </span>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <DrumActionMenu
                      balance={row}
                      customers={customers}
                      products={products}
                      onChanged={refresh}
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
