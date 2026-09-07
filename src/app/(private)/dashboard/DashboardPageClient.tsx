"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ClipboardList,
  PackageX,
  TrendingUp,
  Wallet,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { DashboardOverview } from "@/lib/data/dashboard";
import type { HungerAlertDto } from "@/lib/data/hunger";
import type { RfmOverview } from "@/lib/data/rfm";
import { hungerLevelLabel } from "@/lib/hunger-status";
import {
  RFM_SEGMENTS,
  rfmSegmentLabel,
  type RfmSegment,
} from "@/lib/rfm-status";
import { isNearCreditLimit } from "@/app/(private)/khach-hang/customer-query";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

const vnd = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
  maximumFractionDigits: 0,
});

const compactVnd = new Intl.NumberFormat("vi-VN", {
  notation: "compact",
  maximumFractionDigits: 1,
});

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Chờ duyệt",
  CONFIRMED: "Xuất kho",
  SHIPPED: "Đã giao",
  CANCELLED: "Đã hủy",
  DRAFT: "Nháp",
};

type TypeFilter = "all" | "GARAGE" | "FLEET";

type DashboardPageClientProps = {
  overview: DashboardOverview;
  hungerAlerts: HungerAlertDto[];
  rfm: RfmOverview;
};

function formatShortDate(iso: string): string {
  return new Date(iso).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function remainingLabel(alert: HungerAlertDto): string {
  if (alert.overdue || alert.remaining <= 0) {
    const daysOver = Math.max(0, Math.ceil(-alert.remaining));
    return daysOver === 0 ? "Đến hạn hôm nay" : `Quá hạn ${daysOver} ngày`;
  }
  return `Còn ~${Math.ceil(alert.remaining)} ngày`;
}

function segmentBadgeVariant(
  segment: RfmSegment,
): "default" | "secondary" | "destructive" | "outline" {
  switch (segment) {
    case "VIP":
      return "default";
    case "CHURN_RISK":
      return "destructive";
    case "POTENTIAL":
      return "secondary";
    default:
      return "outline";
  }
}

export function DashboardPageClient({
  overview,
  hungerAlerts,
  rfm,
}: DashboardPageClientProps) {
  const { kpis, statusCounts, monthlyRevenue, topDebtors } = overview;
  const redHunger = hungerAlerts.filter((a) => a.level === "RED").length;
  const yellowHunger = hungerAlerts.filter((a) => a.level === "YELLOW").length;
  const [rfmType, setRfmType] = useState<TypeFilter>("all");

  const filteredRfm = useMemo(() => {
    if (rfmType === "all") return rfm.customers;
    return rfm.customers.filter((c) => c.customerType === rfmType);
  }, [rfm.customers, rfmType]);

  const filteredSegmentCounts = useMemo(() => {
    const counts: Record<RfmSegment, number> = {
      VIP: 0,
      CHURN_RISK: 0,
      POTENTIAL: 0,
      NEW_LOW: 0,
      STABLE: 0,
    };
    for (const c of filteredRfm) counts[c.segment] += 1;
    return counts;
  }, [filteredRfm]);

  const chartData = monthlyRevenue.map((point) => ({
    ...point,
    display: point.revenue,
  }));

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Doanh thu, công nợ và cảnh báo Garage sắp hết hàng
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <Card className="bg-background shadow-none ring-1 ring-border/60">
          <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Doanh thu tháng này
            </CardTitle>
            <TrendingUp className="size-4 text-sky-600" aria-hidden />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold tracking-tight text-sky-700 sm:text-3xl">
              {vnd.format(kpis.revenueMtd)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Đơn chưa hủy (MTD)
            </p>
          </CardContent>
        </Card>

        <Card className="bg-background shadow-none ring-1 ring-border/60">
          <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Số đơn tháng này
            </CardTitle>
            <ClipboardList className="size-4 text-violet-600" aria-hidden />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold tracking-tight text-violet-700">
              {kpis.orderCountMtd}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Pending / Confirmed / Shipped
            </p>
          </CardContent>
        </Card>

        <Card className="bg-background shadow-none ring-1 ring-border/60">
          <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Tổng công nợ
            </CardTitle>
            <Wallet className="size-4 text-amber-600" aria-hidden />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold tracking-tight text-amber-700 sm:text-3xl">
              {vnd.format(kpis.totalDebt)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Dư nợ đang treo
            </p>
          </CardContent>
        </Card>

        <Card className="bg-background shadow-none ring-1 ring-border/60">
          <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Gần hạn mức
            </CardTitle>
            <AlertTriangle className="size-4 text-red-600" aria-hidden />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold tracking-tight text-red-700">
              {kpis.nearLimitCount}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              KH ≥ 80% hạn mức
            </p>
          </CardContent>
        </Card>

        <Card className="bg-background shadow-none ring-1 ring-border/60">
          <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Đói hàng
            </CardTitle>
            <PackageX className="size-4 text-orange-600" aria-hidden />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold tracking-tight text-orange-700">
              {hungerAlerts.length}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {redHunger} đỏ · {yellowHunger} vàng
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap gap-2">
        {(
          ["PENDING", "CONFIRMED", "SHIPPED", "CANCELLED"] as const
        ).map((status) => (
          <Badge key={status} variant="outline" className="gap-1.5 px-3 py-1">
            <span className="text-muted-foreground">
              {STATUS_LABELS[status]}
            </span>
            <span className="font-semibold tabular-nums">
              {statusCounts[status]}
            </span>
          </Badge>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-5">
        <Card className="bg-background shadow-none ring-1 ring-border/60 xl:col-span-3">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">
              Doanh thu 6 tháng gần nhất
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={chartData}
                  margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="0%"
                        stopColor="var(--color-sky-500, #0ea5e9)"
                        stopOpacity={0.35}
                      />
                      <stop
                        offset="100%"
                        stopColor="var(--color-sky-500, #0ea5e9)"
                        stopOpacity={0.02}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    className="stroke-border"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="label"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    width={52}
                    tick={{ fontSize: 11 }}
                    tickFormatter={(v: number) => compactVnd.format(v)}
                  />
                  <Tooltip
                    formatter={(value) => [
                      vnd.format(Number(value ?? 0)),
                      "Doanh thu",
                    ]}
                    labelFormatter={(label) => String(label)}
                    contentStyle={{
                      borderRadius: 8,
                      border: "1px solid hsl(var(--border))",
                      fontSize: 12,
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="display"
                    stroke="#0284c7"
                    strokeWidth={2}
                    fill="url(#revFill)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-background shadow-none ring-1 ring-border/60 xl:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">
              Top 5 công nợ
            </CardTitle>
          </CardHeader>
          <CardContent className="px-0 pb-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-6">Khách hàng</TableHead>
                  <TableHead className="pr-6 text-right">Dư nợ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topDebtors.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={2}
                      className="h-24 text-center text-muted-foreground"
                    >
                      Chưa có công nợ.
                    </TableCell>
                  </TableRow>
                ) : (
                  topDebtors.map((c) => {
                    const near = isNearCreditLimit(
                      c.currentDebt,
                      c.creditLimit,
                    );
                    return (
                      <TableRow key={c.id}>
                        <TableCell className="pl-6 font-medium">
                          <div className="flex flex-col gap-0.5">
                            <span>{c.name}</span>
                            <span className="text-xs text-muted-foreground">
                              HM {vnd.format(c.creditLimit)}
                              {near ? " · gần hạn" : ""}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="pr-6 text-right tabular-nums font-semibold">
                          {vnd.format(c.currentDebt)}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-background shadow-none ring-1 ring-border/60">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">
            Cảnh báo đói hàng
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Garage sắp đến / quá chu kỳ đặt lại — ưu tiên ghé thăm
          </p>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-6">Garage</TableHead>
                <TableHead>Đơn cuối</TableHead>
                <TableHead>Chu kỳ TB</TableHead>
                <TableHead>Tình trạng</TableHead>
                <TableHead>SKU hay mua</TableHead>
                <TableHead className="pr-6">Check-in cuối</TableHead>
                <TableHead>Mức</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {hungerAlerts.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="h-24 text-center text-muted-foreground"
                  >
                    Không có Garage trong vùng cảnh báo. Các điểm đang trong
                    chu kỳ bình thường.
                  </TableCell>
                </TableRow>
              ) : (
                hungerAlerts.map((alert) => (
                  <TableRow key={alert.customerId}>
                    <TableCell className="pl-6 font-medium">
                      <div className="flex flex-col gap-0.5">
                        <span>{alert.customerName}</span>
                        {alert.customerPhone ? (
                          <span className="text-xs text-muted-foreground">
                            {alert.customerPhone}
                          </span>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-sm">
                      {formatShortDate(alert.lastOrderAt)}
                      <span className="mt-0.5 block text-xs text-muted-foreground">
                        {alert.daysSinceLast} ngày trước
                      </span>
                    </TableCell>
                    <TableCell className="tabular-nums text-sm">
                      {alert.avgCycleDays} ngày
                    </TableCell>
                    <TableCell className="text-sm">
                      {remainingLabel(alert)}
                      <span className="mt-0.5 block text-xs text-muted-foreground">
                        Dự kiến {formatShortDate(alert.expectedNextAt)}
                      </span>
                    </TableCell>
                    <TableCell className="max-w-[160px] text-sm whitespace-normal text-muted-foreground">
                      {alert.topSku
                        ? `${alert.topSku}${alert.topProductName ? ` · ${alert.topProductName}` : ""}`
                        : "—"}
                    </TableCell>
                    <TableCell className="pr-6 text-sm text-muted-foreground">
                      {alert.lastCheckInAt
                        ? formatShortDate(alert.lastCheckInAt)
                        : "Chưa có"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          alert.level === "RED" ? "destructive" : "secondary"
                        }
                      >
                        {hungerLevelLabel(alert.level)}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="bg-background shadow-none ring-1 ring-border/60">
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle className="text-base font-semibold">
                Ma trận RFM
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Phân nhóm theo Recency / Frequency / Monetary — cửa sổ{" "}
                {rfm.windowDays} ngày
              </p>
            </div>
            <Select
              value={rfmType}
              onValueChange={(v) => {
                if (v === "all" || v === "GARAGE" || v === "FLEET") {
                  setRfmType(v);
                }
              }}
            >
              <SelectTrigger className="h-9 w-full sm:w-44">
                <SelectValue placeholder="Loại khách" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả loại</SelectItem>
                <SelectItem value="GARAGE">Garage</SelectItem>
                <SelectItem value="FLEET">Đội xe</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {RFM_SEGMENTS.map((seg) => (
              <Badge
                key={seg}
                variant={segmentBadgeVariant(seg)}
                className="gap-1.5 px-3 py-1"
              >
                <span>{rfmSegmentLabel(seg)}</span>
                <span className="font-semibold tabular-nums">
                  {filteredSegmentCounts[seg]}
                </span>
              </Badge>
            ))}
          </div>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-6">Khách hàng</TableHead>
                <TableHead>Loại</TableHead>
                <TableHead className="text-right">R (ngày)</TableHead>
                <TableHead className="text-right">F (đơn)</TableHead>
                <TableHead className="text-right">M (VND)</TableHead>
                <TableHead>Điểm R·F·M</TableHead>
                <TableHead className="pr-6">Nhóm</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRfm.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="h-24 text-center text-muted-foreground"
                  >
                    Chưa có khách có đơn sold trong {rfm.windowDays} ngày gần
                    đây.
                  </TableCell>
                </TableRow>
              ) : (
                filteredRfm.map((row) => (
                  <TableRow key={row.customerId}>
                    <TableCell className="pl-6 font-medium">
                      {row.customerName}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {row.customerType === "FLEET" ? "Đội xe" : "Garage"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-sm">
                      {row.recencyDays}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-sm">
                      {row.frequency}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-sm">
                      {vnd.format(row.monetary)}
                    </TableCell>
                    <TableCell className="font-mono text-xs tabular-nums">
                      {row.r}·{row.f}·{row.m}
                    </TableCell>
                    <TableCell className="pr-6">
                      <Badge variant={segmentBadgeVariant(row.segment)}>
                        {rfmSegmentLabel(row.segment)}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
