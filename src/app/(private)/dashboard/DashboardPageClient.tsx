"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  Droplets,
  Layers,
  Package,
  Receipt,
  ShieldAlert,
  ShoppingCart,
  TrendingUp,
  Truck,
  Users,
} from "lucide-react";
import {
  Bar,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  Area,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { DashboardOverview } from "@/lib/data/dashboard";
import type { DrumStats } from "@/lib/data/drums";
import type { RfmOverview } from "@/lib/data/rfm";
import { rfmSegmentLabel, type RfmSegment } from "@/lib/rfm-status";

const DRUM_DEPOSIT_PRICE = 300_000;
const CREDIT_ALERT_RATIO = 0.85;

const vnd = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
  maximumFractionDigits: 0,
});

type RfmFilter = "all" | "need_visit" | "credit_alert";

type DashboardPageClientProps = {
  overview: DashboardOverview;
  drumStats: DrumStats;
  rfm: RfmOverview;
};

function segmentBadge(segment: RfmSegment): {
  label: string;
  className: string;
} {
  if (segment === "VIP") {
    return {
      label: "VIP",
      className: "bg-amber-500 text-slate-950",
    };
  }
  if (segment === "CHURN_RISK") {
    return {
      label: "Cần ghé ngay",
      className: "bg-rose-600 text-white",
    };
  }
  return {
    label: rfmSegmentLabel(segment),
    className: "bg-blue-100 text-blue-800",
  };
}

export function DashboardPageClient({
  overview,
  drumStats,
  rfm,
}: DashboardPageClientProps) {
  const [rfmFilter, setRfmFilter] = useState<RfmFilter>("all");
  const { kpis, monthlyTrend, viscosityMix, mtdYear } = overview;

  const drumReturnRate =
    drumStats.totalIssued > 0
      ? Math.round((drumStats.totalReturned / drumStats.totalIssued) * 100)
      : 0;
  const marketDepositValue = drumStats.totalOutstanding * DRUM_DEPOSIT_PRICE;
  const phuyEquiv = kpis.litersMtd / 200;

  const chartData = monthlyTrend.map((p) => ({
    month: p.label,
    revenue: p.revenueTrieu,
    collection: p.collectionTrieu,
    liters: p.liters,
  }));

  const lastTrend = monthlyTrend[monthlyTrend.length - 1];
  const prevTrend = monthlyTrend[monthlyTrend.length - 2];
  const litersMom =
    prevTrend && prevTrend.liters > 0
      ? Math.round(
          ((lastTrend.liters - prevTrend.liters) / prevTrend.liters) * 1000,
        ) / 10
      : null;
  const collectionRate =
    lastTrend && lastTrend.revenue > 0
      ? Math.round((lastTrend.collection / lastTrend.revenue) * 1000) / 10
      : null;

  const vipCount = rfm.segmentCounts.VIP;
  const atRiskCount = rfm.segmentCounts.CHURN_RISK;
  const stableCount =
    rfm.customers.length - vipCount - atRiskCount;
  const totalCust = rfm.customers.length || 1;
  const vipPercent = Math.round((vipCount / totalCust) * 100);
  const atRiskPercent = Math.round((atRiskCount / totalCust) * 100);
  const stablePercent = Math.max(0, 100 - vipPercent - atRiskPercent);

  const needVisitCustomers = useMemo(
    () =>
      rfm.customers.filter(
        (c) => c.segment === "CHURN_RISK" || c.recencyDays >= 30,
      ),
    [rfm.customers],
  );

  const creditAlertCustomers = useMemo(
    () =>
      rfm.customers.filter(
        (c) =>
          c.creditLimit > 0 &&
          c.currentDebt / c.creditLimit >= CREDIT_ALERT_RATIO,
      ),
    [rfm.customers],
  );

  const filteredRfm = useMemo(() => {
    if (rfmFilter === "need_visit") return needVisitCustomers;
    if (rfmFilter === "credit_alert") return creditAlertCustomers;
    return rfm.customers;
  }, [rfmFilter, rfm.customers, needVisitCustomers, creditAlertCustomers]);

  const topViscosity = viscosityMix[0];
  const mom = kpis.revenueMomPct;
  const MomIcon = mom != null && mom < 0 ? ArrowDownRight : ArrowUpRight;

  return (
    <div id="dashboard-view" className="w-full space-y-6">
      {/* 1. Header */}
      <div className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs sm:flex-row sm:items-center">
        <div className="flex items-center gap-2.5">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-amber-600">
            <BarChart3 className="size-5" aria-hidden />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-display text-xl font-extrabold tracking-tight text-slate-900 sm:text-2xl">
                Bảng Chỉ Huy Giám Đốc Kinh Doanh (Executive Dashboard)
              </h2>
              <span className="rounded-full bg-slate-900 px-2.5 py-0.5 font-mono text-xs font-bold text-amber-400">
                MTD {mtdYear}
              </span>
            </div>
            <p className="mt-0.5 text-xs text-slate-500">
              Giám sát doanh số dầu nhớt, sản lượng xuất kho quy đổi (Lít), thu
              hồi vỏ phuy và an toàn công nợ B2B
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/sales"
            className="font-mono flex items-center gap-1.5 rounded-xl bg-amber-500 px-3.5 py-2 text-xs font-bold text-slate-950 shadow-xs transition-all hover:bg-amber-400 active:scale-95"
          >
            <Truck className="size-4" aria-hidden />
            <span>Tuyến Sales GPS</span>
          </Link>
          <Link
            href="/don-hang"
            className="font-mono flex items-center gap-1.5 rounded-xl bg-slate-900 px-3.5 py-2 text-xs font-bold text-white shadow-xs transition-all hover:bg-slate-800 active:scale-95"
          >
            <Layers className="size-4 text-amber-400" aria-hidden />
            <span>Điều Phối Đơn Hàng</span>
          </Link>
        </div>
      </div>

      {/* 2. KPI row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold tracking-wider text-slate-500 uppercase">
              Doanh Số Tháng Này (MTD)
            </span>
            <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <TrendingUp className="size-4" aria-hidden />
            </div>
          </div>
          <div className="mt-3">
            <div className="font-mono text-2xl font-black text-slate-900">
              {vnd.format(kpis.revenueMtd)}
            </div>
            {mom != null ? (
              <div
                className={`mt-1 flex items-center gap-1 text-[11px] font-semibold ${
                  mom >= 0 ? "text-emerald-600" : "text-rose-600"
                }`}
              >
                <MomIcon className="size-3.5" aria-hidden />
                <span>
                  {mom >= 0 ? "+" : ""}
                  {mom}% so với tháng trước
                </span>
              </div>
            ) : (
              <div className="mt-1 text-[11px] font-semibold text-slate-500">
                Chưa có dữ liệu tháng trước để so sánh
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold tracking-wider text-slate-500 uppercase">
              Sản Lượng Xuất Kho
            </span>
            <div className="flex size-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
              <Droplets className="size-4" aria-hidden />
            </div>
          </div>
          <div className="mt-3">
            <div className="font-mono text-2xl font-black text-amber-600">
              {kpis.litersMtd.toLocaleString("vi-VN")}{" "}
              <span className="text-sm font-semibold text-slate-500">Lít</span>
            </div>
            <div className="mt-1 text-[11px] text-slate-500">
              Tương đương ~{" "}
              <strong>
                {phuyEquiv.toLocaleString("vi-VN", {
                  maximumFractionDigits: 1,
                })}{" "}
                Phuy 200L
              </strong>
            </div>
          </div>
        </div>

        <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold tracking-wider text-slate-500 uppercase">
              Tỷ Lệ Thu Hồi Vỏ Phuy
            </span>
            <div className="flex size-8 items-center justify-center rounded-lg bg-cyan-50 text-cyan-600">
              <Package className="size-4" aria-hidden />
            </div>
          </div>
          <div className="mt-3">
            <div className="font-mono text-2xl font-black text-cyan-700">
              {drumReturnRate}%
            </div>
            <div className="mt-1 text-[11px] font-medium text-cyan-800">
              Còn{" "}
              <strong>
                {drumStats.totalOutstanding.toLocaleString("vi-VN")} vỏ ngoài
                thị trường
              </strong>
            </div>
          </div>
        </div>

        <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold tracking-wider text-slate-500 uppercase">
              Nợ Cảnh Báo Chạm Trần
            </span>
            <div className="flex size-8 items-center justify-center rounded-lg bg-rose-50 text-rose-600">
              <ShieldAlert className="size-4" aria-hidden />
            </div>
          </div>
          <div className="mt-3">
            <div className="font-mono text-2xl font-black text-rose-600">
              {vnd.format(kpis.nearLimitDebtSum)}
            </div>
            <div className="mt-1 text-[11px] font-medium text-rose-600">
              {kpis.nearLimitCount} khách hàng &gt;85% hạn mức được duyệt
            </div>
          </div>
        </div>
      </div>

      {/* 3. Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-xs lg:col-span-7">
          <div>
            <div className="flex flex-col justify-between gap-2 border-b border-slate-100 pb-3 sm:flex-row sm:items-center">
              <div>
                <h3 className="flex items-center gap-2 text-sm font-extrabold text-slate-900">
                  <TrendingUp className="size-4 text-amber-500" aria-hidden />
                  <span>
                    Biến Động Doanh Số &amp; Sản Lượng 6 Tháng Gần Nhất
                  </span>
                </h3>
                <p className="mt-0.5 text-xs text-slate-500">
                  Đối chiếu Doanh số bán, Tiền thu nợ proxy (đơn SHIPPED) và Sản
                  lượng (Lít)
                </p>
              </div>
              <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 font-mono text-[11px] text-slate-500">
                <span className="size-2 rounded-full bg-amber-500" />
                <span>Doanh số</span>
                <span className="ml-1 size-2 rounded-full bg-emerald-500" />
                <span>Thu nợ</span>
                <span className="ml-1 size-2 rounded-full bg-sky-500" />
                <span>Lít</span>
              </div>
            </div>

            <div className="mt-4 h-[320px] w-full">
              {chartData.every(
                (p) => p.revenue === 0 && p.collection === 0 && p.liters === 0,
              ) ? (
                <div className="flex h-full items-center justify-center text-sm text-slate-500">
                  Chưa có dữ liệu doanh thu 6 tháng.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart
                    data={chartData}
                    margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient
                        id="litersGradient"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#0284C7"
                          stopOpacity={0.25}
                        />
                        <stop
                          offset="95%"
                          stopColor="#0284C7"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#F1F5F9"
                    />
                    <XAxis
                      dataKey="month"
                      tick={{ fontSize: 11, fill: "#64748B", fontWeight: 600 }}
                      axisLine={{ stroke: "#E2E8F0" }}
                      tickLine={false}
                    />
                    <YAxis
                      yAxisId="left"
                      tick={{
                        fontSize: 11,
                        fill: "#64748B",
                        fontFamily: "monospace",
                      }}
                      tickFormatter={(val) => `${val}Tr`}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      tick={{
                        fontSize: 11,
                        fill: "#0284C7",
                        fontFamily: "monospace",
                      }}
                      tickFormatter={(val) => `${val}L`}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#0F172A",
                        color: "#FFFFFF",
                        borderRadius: "12px",
                        border: "none",
                        fontSize: "12px",
                        boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.3)",
                      }}
                      formatter={(value, name) => {
                        const n = typeof value === "number" ? value : Number(value);
                        if (name === "Doanh số bán" || name === "Tiền thu nợ") {
                          return [`${n} Triệu VNĐ`, name];
                        }
                        if (name === "Sản lượng Lít") {
                          return [`${n.toLocaleString("vi-VN")} Lít`, name];
                        }
                        return [value, name];
                      }}
                    />
                    <Bar
                      yAxisId="left"
                      dataKey="revenue"
                      name="Doanh số bán"
                      fill="#F59E0B"
                      radius={[4, 4, 0, 0]}
                      barSize={18}
                    />
                    <Bar
                      yAxisId="left"
                      dataKey="collection"
                      name="Tiền thu nợ"
                      fill="#10B981"
                      radius={[4, 4, 0, 0]}
                      barSize={18}
                    />
                    <Area
                      yAxisId="right"
                      type="monotone"
                      dataKey="liters"
                      fill="url(#litersGradient)"
                      stroke="none"
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="liters"
                      name="Sản lượng Lít"
                      stroke="#0284C7"
                      strokeWidth={3}
                      dot={{
                        r: 4,
                        fill: "#0284C7",
                        strokeWidth: 2,
                        stroke: "#FFFFFF",
                      }}
                      activeDot={{ r: 6, fill: "#0284C7" }}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="mt-2 flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-500">
            <span>
              {lastTrend
                ? `${lastTrend.label}: ${lastTrend.liters.toLocaleString("vi-VN")} Lít`
                : "—"}
              {litersMom != null
                ? ` (${litersMom >= 0 ? "+" : ""}${litersMom}% so với tháng trước).`
                : "."}
            </span>
            {collectionRate != null ? (
              <span className="font-mono font-bold text-emerald-600">
                Thu hồi nợ (proxy): {collectionRate}%
              </span>
            ) : null}
          </div>
        </div>

        <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-xs lg:col-span-5">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="flex items-center gap-2 text-sm font-extrabold text-slate-900">
                  <Droplets className="size-4 text-amber-500" aria-hidden />
                  <span>Cơ Cấu Sản Lượng Theo Cấp Độ Nhớt</span>
                </h3>
                <p className="mt-0.5 text-xs text-slate-500">
                  Tỷ trọng dầu động cơ và dầu thủy lực (MTD)
                </p>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 items-center gap-4 sm:grid-cols-12">
              <div className="relative flex h-[220px] items-center justify-center sm:col-span-7">
                {viscosityMix.length === 0 ? (
                  <div className="text-center text-sm text-slate-500">
                    Chưa có sản lượng theo viscosity.
                  </div>
                ) : (
                  <>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={viscosityMix}
                          dataKey="liters"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius={62}
                          outerRadius={88}
                          paddingAngle={3}
                          stroke="#FFFFFF"
                          strokeWidth={2}
                        >
                          {viscosityMix.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#0F172A",
                            color: "#FFFFFF",
                            borderRadius: "10px",
                            border: "none",
                            fontSize: "11px",
                          }}
                          formatter={(value, name) => [
                            `${Number(value).toLocaleString("vi-VN")} Lít`,
                            name,
                          ]}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="pointer-events-none absolute inset-0 flex select-none flex-col items-center justify-center">
                      <span className="font-mono text-2xl font-black tracking-tight text-slate-900">
                        {kpis.litersMtd.toLocaleString("vi-VN")} L
                      </span>
                      <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                        Tổng xuất kho
                      </span>
                    </div>
                  </>
                )}
              </div>

              <div className="space-y-2.5 sm:col-span-5">
                {viscosityMix.slice(0, 4).map((item) => (
                  <div
                    key={item.name}
                    className="rounded-xl border border-slate-100 bg-slate-50/80 p-2 text-xs"
                  >
                    <div className="flex items-center gap-1.5 truncate font-bold text-slate-800">
                      <span
                        className="size-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="truncate">
                        {item.name.split(" ")[0]}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center justify-between pl-4 font-mono text-[11px] text-slate-600">
                      <span className="font-bold">
                        {item.liters.toLocaleString("vi-VN")} L
                      </span>
                      <span className="font-semibold text-slate-400">
                        {item.percent}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-3 border-t border-slate-100 pt-3 text-[11px] text-slate-500">
            {topViscosity
              ? `Dòng nhớt ${topViscosity.name} chiếm tỷ trọng lớn nhất (${topViscosity.percent}%).`
              : "Bổ sung trường viscosity / volume trên sản phẩm để biểu đồ có dữ liệu."}
          </div>
        </div>
      </div>

      {/* 4. Drum banner */}
      <div className="rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-5 text-white shadow-md sm:p-6">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div className="flex items-center gap-3">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-xl border border-amber-500/30 bg-amber-500/20 text-amber-400">
              <Package className="size-6" aria-hidden />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-amber-400/20 px-2 py-0.5 font-mono text-[10px] font-bold tracking-wider text-amber-300 uppercase">
                  Quản lý tài sản kho
                </span>
                <span className="font-mono text-xs text-slate-400">
                  Chu kỳ 45 ngày
                </span>
              </div>
              <h3 className="mt-0.5 text-lg font-bold tracking-tight text-white">
                Giám Sát Vòng Đời Vỏ Phuy Sắt 200L Ngoài Thị Trường
              </h3>
              <p className="mt-1 text-xs text-slate-300">
                Theo dõi đối soát 2 chiều giữa sản lượng giao nguyên phuy và số
                lượng vỏ rỗng thu hồi
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/15 px-4 py-2.5">
              <div className="text-[10px] font-bold tracking-wider text-emerald-400 uppercase">
                Vỏ Mới Giao (MTD)
              </div>
              <div className="flex items-center gap-1 font-mono text-xl font-black text-emerald-300">
                <span>+{drumStats.issuedMtd}</span>
                <span className="text-xs font-normal text-emerald-400/80">
                  vỏ
                </span>
              </div>
            </div>

            <div className="rounded-xl border border-orange-500/30 bg-orange-500/15 px-4 py-2.5">
              <div className="text-[10px] font-bold tracking-wider text-orange-400 uppercase">
                Vỏ Đã Thu Hồi
              </div>
              <div className="flex items-center gap-1 font-mono text-xl font-black text-orange-300">
                <span>-{drumStats.returnedMtd}</span>
                <span className="text-xs font-normal text-orange-400/80">
                  vỏ
                </span>
              </div>
            </div>

            <div className="rounded-xl border border-amber-500/40 bg-amber-500/15 px-4 py-2.5">
              <div className="text-[10px] font-bold tracking-wider text-amber-400 uppercase">
                Cảnh Báo Đọng Vốn
              </div>
              <div className="mt-0.5 text-xs font-bold text-amber-200">
                Còn{" "}
                <strong className="font-mono text-sm text-white">
                  {drumStats.totalOutstanding.toLocaleString("vi-VN")} vỏ
                </strong>{" "}
                ngoài thị trường
              </div>
              <div className="mt-0.5 font-mono text-[11px] font-bold text-amber-300">
                ~ {vnd.format(marketDepositValue)} tiền cọc
              </div>
            </div>

            <Link
              href="/vo-phuy"
              className="flex shrink-0 items-center gap-1.5 rounded-xl bg-amber-500 px-4 py-2.5 text-xs font-bold text-slate-950 shadow-sm transition-all hover:bg-amber-400"
            >
              <span>Sổ Phuy Chi Tiết</span>
              <ArrowRight className="size-3.5" aria-hidden />
            </Link>
          </div>
        </div>
      </div>

      {/* 5. RFM cards */}
      <div className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs sm:p-6">
        <div className="flex flex-col justify-between gap-4 border-b border-slate-100 pb-4 lg:flex-row lg:items-center">
          <div>
            <div className="flex items-center gap-2">
              <Users className="size-5 text-blue-600" aria-hidden />
              <h3 className="text-base font-extrabold text-slate-900">
                Phân Cụm Sức Mua Khách Hàng (RFM Customer Segmentation)
              </h3>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Phân loại nhóm hành vi trong cửa sổ {rfm.windowDays} ngày: VIP,
              nguy cơ rời bỏ và các nhóm còn lại
            </p>
          </div>

          <div className="w-full space-y-1.5 lg:w-96">
            <div className="flex items-center justify-between font-mono text-xs font-bold">
              <span className="text-amber-600">VIP: {vipPercent}%</span>
              <span className="text-rose-600">Nguy cơ: {atRiskPercent}%</span>
              <span className="text-blue-600">Ổn định: {stablePercent}%</span>
            </div>
            <div className="flex h-3 w-full overflow-hidden rounded-full border border-slate-200 bg-slate-100">
              <div
                className="h-full bg-amber-500 transition-all"
                style={{ width: `${vipPercent}%` }}
                title={`VIP: ${vipPercent}%`}
              />
              <div
                className="h-full bg-rose-500 transition-all"
                style={{ width: `${atRiskPercent}%` }}
                title={`Nguy cơ: ${atRiskPercent}%`}
              />
              <div
                className="h-full bg-blue-500 transition-all"
                style={{ width: `${stablePercent}%` }}
                title={`Ổn định: ${stablePercent}% (${stableCount})`}
              />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5 rounded-xl bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => setRfmFilter("all")}
              className={`cursor-pointer rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                rfmFilter === "all"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Tất cả ({rfm.customers.length})
            </button>
            <button
              type="button"
              onClick={() => setRfmFilter("need_visit")}
              className={`flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                rfmFilter === "need_visit"
                  ? "bg-rose-600 text-white shadow-xs"
                  : "text-rose-700 hover:bg-rose-50"
              }`}
            >
              <AlertTriangle className="size-3.5" aria-hidden />
              <span>Cần ghé ngay ({needVisitCustomers.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setRfmFilter("credit_alert")}
              className={`flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                rfmFilter === "credit_alert"
                  ? "bg-amber-500 text-slate-950 shadow-xs"
                  : "text-amber-800 hover:bg-amber-50"
              }`}
            >
              <ShieldAlert className="size-3.5" aria-hidden />
              <span>Nợ sắp chạm trần ({creditAlertCustomers.length})</span>
            </button>
          </div>

          <div className="text-xs text-slate-500">
            Hiển thị <strong>{Math.min(filteredRfm.length, 6)}</strong> /{" "}
            {filteredRfm.length} khách hàng phù hợp bộ lọc
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredRfm.length === 0 ? (
            <div className="col-span-full rounded-2xl border border-dashed border-slate-200 py-10 text-center text-sm text-slate-500">
              Không có khách hàng phù hợp bộ lọc.
            </div>
          ) : (
            filteredRfm.slice(0, 6).map((c) => {
              const isVip = c.segment === "VIP";
              const isAtRisk = c.segment === "CHURN_RISK";
              const debtUsagePercent = Math.round(
                (c.currentDebt / (c.creditLimit || 1)) * 100,
              );
              const badge = segmentBadge(c.segment);

              return (
                <div
                  key={c.customerId}
                  className={`flex flex-col justify-between rounded-2xl border p-4 transition-all ${
                    isAtRisk
                      ? "border-rose-200 bg-rose-50/40 hover:border-rose-300"
                      : isVip
                        ? "border-amber-200 bg-amber-50/30 hover:border-amber-300"
                        : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <div>
                    <div className="mb-1.5 flex items-center justify-between gap-1">
                      <span className="font-mono text-xs font-bold text-slate-400">
                        {c.customerType} · {c.customerId.slice(-6)}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 font-mono text-[10px] font-bold uppercase ${badge.className}`}
                      >
                        {badge.label}
                      </span>
                    </div>

                    <h4 className="truncate text-sm font-bold text-slate-900">
                      {c.customerName}
                    </h4>
                    <p className="mt-0.5 truncate text-xs text-slate-500">
                      {c.address || "Chưa có địa chỉ"}
                    </p>

                    <div className="mt-3 space-y-1.5 rounded-xl border border-slate-100 bg-white p-2.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Công nợ hiện tại:</span>
                        <span className="font-mono font-bold text-slate-900">
                          {vnd.format(c.currentDebt)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Mức dùng hạn mức:</span>
                        <span
                          className={`font-mono font-bold ${
                            debtUsagePercent >= 85
                              ? "text-rose-600"
                              : "text-slate-700"
                          }`}
                        >
                          {c.creditLimit > 0 ? debtUsagePercent : 0}% (
                          {vnd.format(c.creditLimit)})
                        </span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className={`h-full rounded-full ${
                            debtUsagePercent >= 85
                              ? "bg-rose-500"
                              : "bg-amber-400"
                          }`}
                          style={{
                            width: `${Math.min(100, Math.max(0, debtUsagePercent))}%`,
                          }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-400">Lần mua gần nhất:</span>
                        <span className="font-mono font-semibold text-slate-600">
                          {c.recencyDays} ngày trước
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center gap-2 border-t border-slate-100 pt-3">
                    <Link
                      href="/don-hang"
                      className="flex flex-1 items-center justify-center gap-1 rounded-xl bg-amber-500 px-2 py-1.5 text-xs font-bold text-slate-950 transition-colors hover:bg-amber-400"
                    >
                      <ShoppingCart className="size-3.5" aria-hidden />
                      <span>Tạo đơn gợi ý</span>
                    </Link>
                    <Link
                      href="/khach-hang"
                      className="flex items-center justify-center gap-1 rounded-xl bg-slate-100 px-2.5 py-1.5 text-xs font-bold text-slate-700 transition-colors hover:bg-slate-200"
                    >
                      <Receipt className="size-3.5" aria-hidden />
                      <span>Công nợ</span>
                    </Link>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="flex flex-col items-start justify-between gap-2 border-t border-slate-100 pt-2 text-xs text-slate-500 sm:flex-row sm:items-center">
          <span>
            Xem phân tích chi tiết sức khỏe tài chính và điều chỉnh hạn mức tín
            dụng khách hàng
          </span>
          <Link
            href="/khach-hang"
            className="flex items-center gap-1 font-bold text-amber-700 hover:text-amber-800"
          >
            <span>Đến phân hệ Quản lý Khách hàng &amp; Công nợ</span>
            <ArrowRight className="size-4" aria-hidden />
          </Link>
        </div>
      </div>
    </div>
  );
}
