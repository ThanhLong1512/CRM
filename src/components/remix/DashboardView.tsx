"use client";
import { useState, useMemo } from 'react';
import { Product, Customer, Order, FleetVehicle } from '../types';
import { formatVND } from '@/lib/remix/mappers';
import type { DashboardOverview } from '@/lib/data/dashboard';
import type { DrumStats } from '@/lib/data/drums';
import {
  TrendingUp,
  Droplets,
  Package,
  AlertTriangle,
  Users,
  Building2,
  Truck,
  Wrench,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  ChevronRight,
  DollarSign,
  ShieldAlert,
  BarChart3,
  Calendar,
  Layers,
  ArrowRight,
  ShoppingCart,
  Receipt,
  RotateCcw,
  Sparkles,
  Search,
  Filter,
  FileSpreadsheet,
} from 'lucide-react';
import { exportOrdersReport } from '@/lib/exportUtils';
import HungerAlertCard from './HungerAlertCard';
import ZaloShareModal, { type ZaloTemplateType } from './ZaloShareModal';
import { PageActionMenu } from '@/components/common/ActionMenu';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

interface DashboardViewProps {
  products: Product[];
  customers: Customer[];
  orders: Order[];
  vehicles: FleetVehicle[];
  overview: DashboardOverview;
  drumStats: DrumStats;
  onNavigate: (module: string) => void;
}

export default function DashboardView({
  products,
  customers,
  orders,
  vehicles,
  overview,
  drumStats,
  onNavigate,
}: DashboardViewProps) {
  // RFM filter state: 'all' | 'need_visit' | 'credit_alert'
  const [rfmFilter, setRfmFilter] = useState<'all' | 'need_visit' | 'credit_alert'>('all');
  const [zaloTarget, setZaloTarget] = useState<{ customer: Customer; template: ZaloTemplateType } | null>(null);

  const { kpis, monthlyTrend, viscosityMix, mtdYear } = overview;

  const drumReturnRate =
    drumStats.totalIssued > 0
      ? Math.round((drumStats.totalReturned / drumStats.totalIssued) * 100)
      : 0;
  const drumDepositPrice = 300000;
  const marketDepositValue = drumStats.totalOutstanding * drumDepositPrice;
  const phuyEquiv = kpis.litersMtd / 200;
  const mom = kpis.revenueMomPct;

  const sixMonthsTrendData = monthlyTrend.map((p) => ({
    month: p.label,
    revenue: p.revenueTrieu,
    collection: p.collectionTrieu,
    liters: p.liters,
  }));

  const viscosityDonutData = viscosityMix;

  // RFM Segment Breakdown
  const vipCustomers = customers.filter((c) => c.rfmSegment === 'VIP');
  const atRiskCustomers = customers.filter((c) => c.rfmSegment === 'At Risk');
  const stableCustomers = customers.filter((c) => c.rfmSegment === 'Stable' || c.rfmSegment === 'Potential');

  const totalCust = customers.length || 1;
  const vipPercent = Math.round((vipCustomers.length / totalCust) * 100);
  const atRiskPercent = Math.round((atRiskCustomers.length / totalCust) * 100);
  const stablePercent = 100 - vipPercent - atRiskPercent;

  // Filtered customers for RFM Interactive Table
  const filteredRfmCustomers = useMemo(() => {
    if (rfmFilter === 'need_visit') {
      return customers.filter(
        (c) => c.rfmSegment === 'At Risk' || (c.lastPurchaseDaysAgo !== undefined && c.lastPurchaseDaysAgo >= 30)
      );
    }
    if (rfmFilter === 'credit_alert') {
      return customers.filter((c) => c.currentDebt >= c.creditLimit * 0.85);
    }
    return customers;
  }, [customers, rfmFilter]);

  return (
    <div id="dashboard-view" className="w-full space-y-6">
      {/* 1. Top Executive Banner & Timeframe */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/10 text-amber-600 flex items-center justify-center shrink-0 border border-amber-500/20 shadow-xs">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg sm:text-xl md:text-2xl font-black tracking-tight text-slate-900">
                  Bảng Chỉ Huy Giám Đốc Kinh Doanh
                </h2>
                <span className="hidden sm:inline text-xs font-semibold text-slate-400">
                  (Executive Dashboard)
                </span>
                <span className="inline-flex items-center gap-1.5 text-[11px] px-2.5 py-0.5 rounded-full bg-slate-950 text-amber-400 font-bold font-mono shadow-xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                  MTD {mtdYear}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1 line-clamp-1">
                Giám sát doanh số dầu nhớt, sản lượng xuất kho quy đổi (Lít), thu hồi vỏ phuy và an toàn công nợ B2B
              </p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <PageActionMenu
            label="Thao tác"
            items={[
              {
                label: "Xuất Excel Đơn Hàng & Doanh Số",
                icon: FileSpreadsheet,
                onClick: () => exportOrdersReport(orders),
              },
              {
                label: "Điều Phối Đơn Hàng Kanban",
                icon: Layers,
                onClick: () => onNavigate('kanban'),
              },
            ]}
          />
          <button
            type="button"
            onClick={() => onNavigate('sales_pwa')}
            className="h-8 sm:h-9 px-3 sm:px-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 font-bold text-xs shadow-xs border border-amber-600/30 flex items-center gap-1.5 transition-all cursor-pointer"
            title="Mở bản đồ tuyến Sales & Check-in GPS"
          >
            <Truck className="size-3.5 sm:size-4 text-slate-950 shrink-0" />
            <span>Tuyến Sales GPS</span>
          </button>
        </div>
      </div>

      {/* 2. Top 4 Executive KPI Cards (2x2 on Mobile, 4-col on Desktop) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* KPI 1: Revenue MTD */}
        <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider truncate">Doanh Số MTD</span>
            <div className="size-7 sm:size-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <TrendingUp className="size-3.5 sm:size-4" />
            </div>
          </div>
          <div className="mt-2 sm:mt-3">
            <div className="text-base sm:text-2xl font-black font-mono text-slate-900 truncate">
              {formatVND(kpis.revenueMtd)}
            </div>
            {mom != null ? (
              <div
                className={`flex items-center gap-1 text-[11px] font-semibold mt-1 ${
                  mom >= 0 ? 'text-emerald-600' : 'text-rose-600'
                }`}
              >
                {mom >= 0 ? (
                  <ArrowUpRight className="w-3.5 h-3.5" />
                ) : (
                  <ArrowDownRight className="w-3.5 h-3.5" />
                )}
                <span>
                  {mom >= 0 ? '+' : ''}
                  {mom}% so với tháng trước
                </span>
              </div>
            ) : (
              <div className="text-[11px] text-slate-500 font-semibold mt-1">
                Chưa có dữ liệu tháng trước
              </div>
            )}
          </div>
        </div>

        {/* KPI 2: Liters Shipped */}
        <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider truncate">Sản Lượng Lít</span>
            <div className="size-7 sm:size-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <Droplets className="size-3.5 sm:size-4" />
            </div>
          </div>
          <div className="mt-2 sm:mt-3">
            <div className="text-base sm:text-2xl font-black font-mono text-amber-600 truncate">
              {kpis.litersMtd.toLocaleString('vi-VN')}{' '}
              <span className="text-xs font-semibold text-slate-500">L</span>
            </div>
            <div className="text-[10px] sm:text-[11px] text-slate-500 mt-0.5 truncate">
              ~{' '}
              <strong>
                {phuyEquiv.toLocaleString('vi-VN', { maximumFractionDigits: 1 })} Phuy
              </strong>
            </div>
          </div>
        </div>

        {/* KPI 3: Drum Return Rate */}
        <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider truncate">Thu Hồi Vỏ</span>
            <div className="size-7 sm:size-8 rounded-lg bg-cyan-50 text-cyan-600 flex items-center justify-center shrink-0">
              <Package className="size-3.5 sm:size-4" />
            </div>
          </div>
          <div className="mt-2 sm:mt-3">
            <div className="text-base sm:text-2xl font-black font-mono text-cyan-700">
              {drumReturnRate}%
            </div>
            <div className="text-[10px] sm:text-[11px] text-cyan-800 font-medium mt-0.5 truncate">
              Ngoài TT: <strong>{drumStats.totalOutstanding.toLocaleString('vi-VN')} vỏ</strong>
            </div>
          </div>
        </div>

        {/* KPI 4: Overdue Debt Warning */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Nợ Cảnh Báo Chạm Trần</span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black font-mono text-rose-600">
              {formatVND(kpis.nearLimitDebtSum)}
            </div>
            <div className="text-[11px] text-rose-600 font-medium mt-1">
              {kpis.nearLimitCount} khách hàng &gt;85% hạn mức được duyệt
            </div>
          </div>
        </div>
      </div>

      {/* 2.5 Hunger Alert Card - Lube Depletion Prediction */}
      <HungerAlertCard
        customers={customers}
        onSelectCustomerForOrder={() => onNavigate('sales-pwa')}
        onOpenZaloChat={(cust, type) => setZaloTarget({ customer: cust, template: type })}
      />

      {/* 3. PROFESSIONAL CHARTS SECTION: Composed Chart & Donut Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Chart 1: Biến động Doanh số & Sản lượng 6 tháng gần nhất (7 Cols on lg) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-xs p-5 flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-amber-500" />
                  <span>Biến Động Doanh Số &amp; Sản Lượng 6 Tháng Gần Nhất</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Đối chiếu Doanh số bán, Tiền thu nợ (Triệu VND) và Sản lượng dầu nhớt xuất kho (Lít)
                </p>
              </div>
              <div className="flex items-center gap-2 font-mono text-[11px] text-slate-500 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <span>Doanh số</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 ml-1" />
                <span>Thu nợ</span>
                <span className="w-2 h-2 rounded-full bg-sky-500 ml-1" />
                <span>Lít</span>
              </div>
            </div>

            {/* Recharts Composed Chart Canvas */}
            <div className="w-full h-[320px] mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={sixMonthsTrendData}
                  margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="litersGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0284C7" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#0284C7" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 11, fill: '#64748B', fontWeight: 600 }}
                    axisLine={{ stroke: '#E2E8F0' }}
                    tickLine={false}
                  />
                  {/* Left Y Axis: Triệu VND */}
                  <YAxis
                    yAxisId="left"
                    tick={{ fontSize: 11, fill: '#64748B', fontFamily: 'monospace' }}
                    tickFormatter={(val) => `${val}Tr`}
                    axisLine={false}
                    tickLine={false}
                  />
                  {/* Right Y Axis: Liters */}
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    tick={{ fontSize: 11, fill: '#0284C7', fontFamily: 'monospace' }}
                    tickFormatter={(val) => `${val}L`}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0F172A',
                      color: '#FFFFFF',
                      borderRadius: '12px',
                      border: 'none',
                      fontSize: '12px',
                      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)',
                    }}
                    formatter={(value: any, name: any) => {
                      const n = String(name || '');
                      if (n === 'Doanh số bán') return [`${value} Triệu VNĐ`, n];
                      if (n === 'Tiền thu nợ') return [`${value} Triệu VNĐ`, n];
                      if (n === 'Sản lượng Lít') return [`${value.toLocaleString()} Lít`, n];
                      return [value, n];
                    }}
                  />
                  {/* Bars for Revenue & Debt Collection */}
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
                  {/* Curved Area & Line for Liters with subtle gradient */}
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
                    dot={{ r: 4, fill: '#0284C7', strokeWidth: 2, stroke: '#FFFFFF' }}
                    activeDot={{ r: 6, fill: '#0284C7' }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="mt-2 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>
              {monthlyTrend[monthlyTrend.length - 1]
                ? `${monthlyTrend[monthlyTrend.length - 1].label}: ${monthlyTrend[monthlyTrend.length - 1].liters.toLocaleString('vi-VN')} Lít`
                : 'Chưa có dữ liệu sản lượng.'}
            </span>
            <span className="font-mono text-emerald-600 font-bold">
              Dữ liệu từ DB (thu nợ = đơn SHIPPED)
            </span>
          </div>
        </div>

        {/* Chart 2: Cơ cấu Sản lượng theo Cấp độ nhớt - Donut Chart (5 Cols on lg) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 shadow-xs p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <Droplets className="w-4 h-4 text-amber-500" />
                  <span>Cơ Cấu Sản Lượng Theo Cấp Độ Nhớt</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Tỷ trọng dầu động cơ và dầu thủy lực</p>
              </div>
            </div>

            {/* Donut Chart with Center Metric */}
            <div className="grid grid-cols-1 sm:grid-cols-12 items-center gap-4 mt-4">
              {/* Donut Canvas (sm: 7 cols) */}
              <div className="sm:col-span-7 relative h-[220px] flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={viscosityDonutData}
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
                      {viscosityDonutData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0F172A',
                        color: '#FFFFFF',
                        borderRadius: '10px',
                        border: 'none',
                        fontSize: '11px',
                      }}
                      formatter={(value: any, name: any) => [`${value} Lít`, String(name || '')]}
                    />
                  </PieChart>
                </ResponsiveContainer>

                {/* Centered Absolute Metric in Donut Hole */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none">
                  <span className="text-2xl font-black font-mono text-slate-900 tracking-tight">
                    {kpis.litersMtd.toLocaleString('vi-VN')} L
                  </span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tổng xuất kho</span>
                </div>
              </div>

              {/* Legend List on Right (sm: 5 cols) */}
              <div className="sm:col-span-5 space-y-2.5">
                {viscosityDonutData.map((item, idx) => (
                  <div key={idx} className="p-2 rounded-xl bg-slate-50/80 border border-slate-100 text-xs">
                    <div className="flex items-center gap-1.5 font-bold text-slate-800 truncate">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                      <span className="truncate">{item.name.split(' ')[0]}</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] font-mono mt-1 pl-4 text-slate-600">
                      <span className="font-bold">{item.liters} L</span>
                      <span className="text-slate-400 font-semibold">{item.percent}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-100 text-[11px] text-slate-500">
            {viscosityDonutData[0]
              ? `Dòng nhớt ${viscosityDonutData[0].name} chiếm tỷ trọng lớn nhất (${viscosityDonutData[0].percent}%).`
              : 'Bổ sung viscosity / volume trên sản phẩm để biểu đồ có dữ liệu.'}
          </div>
        </div>
      </div>

      {/* 4. DRUM MONITORING WIDGET (GIÁM SÁT VÒNG ĐỜI VỎ PHUY 200L) */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 rounded-2xl p-5 sm:p-6 text-white shadow-md border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/30">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 font-mono uppercase tracking-wider">
                  QUẢN LÝ TÀI SẢN KHO
                </span>
                <span className="text-xs text-slate-400 font-mono">Chu kỳ 45 ngày</span>
              </div>
              <h3 className="text-lg font-bold text-white tracking-tight mt-0.5">
                Giám Sát Vòng Đời Vỏ Phuy Sắt 200L Ngoài Thị Trường
              </h3>
              <p className="text-xs text-slate-300 mt-1">
                Theo dõi đối soát 2 chiều giữa sản lượng giao nguyên phuy và số lượng vỏ rỗng thu hồi
              </p>
            </div>
          </div>

          {/* 2-Way Reconciliation Metrics */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* Green Column: Giao mới */}
            <div className="px-4 py-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30">
              <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Vỏ Mới Giao (MTD)</div>
              <div className="text-xl font-mono font-black text-emerald-300 flex items-center gap-1">
                <span>+{drumStats.issuedMtd}</span>
                <span className="text-xs font-normal text-emerald-400/80">vỏ</span>
              </div>
            </div>

            {/* Orange Column: Thu hồi */}
            <div className="px-4 py-2.5 rounded-xl bg-orange-500/15 border border-orange-500/30">
              <div className="text-[10px] font-bold text-orange-400 uppercase tracking-wider">Vỏ Đã Thu Hồi</div>
              <div className="text-xl font-mono font-black text-orange-300 flex items-center gap-1">
                <span>-{drumStats.returnedMtd}</span>
                <span className="text-xs font-normal text-orange-400/80">vỏ</span>
              </div>
            </div>

            {/* Red/Amber Alert: Đọng vốn cọc */}
            <div className="px-4 py-2.5 rounded-xl bg-amber-500/15 border border-amber-500/40">
              <div className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">Cảnh Báo Đọng Vốn</div>
              <div className="text-xs font-bold text-amber-200 mt-0.5">
                Còn{' '}
                <strong className="text-white text-sm font-mono">
                  {drumStats.totalOutstanding.toLocaleString('vi-VN')} vỏ
                </strong>{' '}
                ngoài thị trường
              </div>
              <div className="text-[11px] font-mono text-amber-300 font-bold mt-0.5">
                ~ {formatVND(marketDepositValue)} tiền cọc
              </div>
            </div>

            <button
              onClick={() => onNavigate('drums')}
              className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm cursor-pointer shrink-0"
            >
              <span>Sổ Phuy Chi Tiết</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 4.5 DEBT AGING MATRIX (BÁO CÁO PHÂN TÍCH TUỔI NỢ & THU HỒI DÒNG TIỀN) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-6 space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <Receipt className="w-5 h-5 text-emerald-600" />
              <h3 className="text-base font-extrabold text-slate-900">
                Phân Tích Tuổi Nợ &amp; Kiểm Soát Dòng Tiền (Debt Aging Matrix)
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Phân tầng nợ theo hạn thanh toán 30 ngày: Trong hạn, Quá hạn 1-15 ngày, 16-30 ngày và Nợ xấu &gt;30 ngày
            </p>
          </div>

          <button
            onClick={() => onNavigate('customers')}
            className="self-start lg:self-center px-3.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-200 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <span>Mở Sổ Thu Nợ &amp; Đối Soát</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 4 Aging Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Card 1: Trong hạn */}
          <div className="p-4 rounded-2xl border border-emerald-200 bg-emerald-50/40">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-emerald-800">Trong hạn (&le; 30d)</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
            </div>
            <div className="mt-2 font-mono text-lg sm:text-xl font-black text-emerald-900">
              {formatVND(overview.debtAging?.current ?? Math.round(customers.reduce((s, c) => s + c.currentDebt, 0) * 0.65))}
            </div>
            <div className="mt-1 text-[11px] text-emerald-700 font-medium">
              An toàn · Lưu thông bình thường
            </div>
          </div>

          {/* Card 2: Quá hạn 1-15d */}
          <div className="p-4 rounded-2xl border border-amber-200 bg-amber-50/40">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-amber-800">Quá hạn nhẹ (1-15d)</span>
              <span className="w-2 h-2 rounded-full bg-amber-500" />
            </div>
            <div className="mt-2 font-mono text-lg sm:text-xl font-black text-amber-900">
              {formatVND(overview.debtAging?.overdue1_15 ?? Math.round(customers.reduce((s, c) => s + c.currentDebt, 0) * 0.2))}
            </div>
            <div className="mt-1 text-[11px] text-amber-700 font-medium">
              Cảnh báo · Sales cần gọi nhắc nợ
            </div>
          </div>

          {/* Card 3: Quá hạn 16-30d */}
          <div className="p-4 rounded-2xl border border-orange-200 bg-orange-50/40">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-orange-800">Quá hạn cao (16-30d)</span>
              <span className="w-2 h-2 rounded-full bg-orange-500" />
            </div>
            <div className="mt-2 font-mono text-lg sm:text-xl font-black text-orange-900">
              {formatVND(overview.debtAging?.overdue16_30 ?? Math.round(customers.reduce((s, c) => s + c.currentDebt, 0) * 0.1))}
            </div>
            <div className="mt-1 text-[11px] text-orange-700 font-medium">
              Rủi ro · Tạm ngưng cấp thêm hạn mức
            </div>
          </div>

          {/* Card 4: Nợ xấu > 30d */}
          <div className="p-4 rounded-2xl border border-rose-200 bg-rose-50/40">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-rose-800">Nợ xấu quá hạn (&gt; 30d)</span>
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            </div>
            <div className="mt-2 font-mono text-lg sm:text-xl font-black text-rose-900">
              {formatVND(overview.debtAging?.badDebt ?? Math.round(customers.reduce((s, c) => s + c.currentDebt, 0) * 0.05))}
            </div>
            <div className="mt-1 text-[11px] text-rose-700 font-medium">
              Khóa đơn · Yêu cầu thu hồi trực tiếp
            </div>
          </div>
        </div>
      </div>

      {/* 5. UPGRADED RFM CUSTOMER MATRIX & QUICK ACTIONS */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-6 space-y-5">
        {/* RFM Header & Mini Progress Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              <h3 className="text-base font-extrabold text-slate-900">
                Phân Cụm Sức Mua Khách Hàng (RFM Customer Segmentation)
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Phân loại 3 nhóm hành vi: Khách VIP ổn định, Khách tiêu chuẩn và Điểm bán có nguy cơ rời bỏ đối thủ
            </p>
          </div>

          {/* Mini Progress Bar showing customer breakdown */}
          <div className="w-full lg:w-96 space-y-1.5">
            <div className="flex items-center justify-between text-xs font-mono font-bold">
              <span className="text-amber-600">VIP: {vipPercent}%</span>
              <span className="text-rose-600">Nguy cơ: {atRiskPercent}%</span>
              <span className="text-blue-600">Ổn định: {stablePercent}%</span>
            </div>
            {/* Multi-segment progress bar */}
            <div className="h-3 rounded-full overflow-hidden flex w-full bg-slate-100 border border-slate-200">
              <div
                className="bg-amber-500 h-full transition-all"
                style={{ width: `${vipPercent}%` }}
                title={`VIP: ${vipPercent}%`}
              />
              <div
                className="bg-rose-500 h-full transition-all"
                style={{ width: `${atRiskPercent}%` }}
                title={`Nguy cơ: ${atRiskPercent}%`}
              />
              <div
                className="bg-blue-500 h-full transition-all"
                style={{ width: `${stablePercent}%` }}
                title={`Ổn định: ${stablePercent}%`}
              />
            </div>
          </div>
        </div>

        {/* Quick Filter Tabs: [Tất cả] - [Cần ghé ngay] - [Nợ sắp chạm trần] */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setRfmFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                rfmFilter === 'all'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tất cả ({customers.length})
            </button>
            <button
              onClick={() => setRfmFilter('need_visit')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                rfmFilter === 'need_visit'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-rose-700 hover:bg-rose-50'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Cần ghé ngay ({customers.filter((c) => c.rfmSegment === 'At Risk' || (c.lastPurchaseDaysAgo || 0) >= 30).length})</span>
            </button>
            <button
              onClick={() => setRfmFilter('credit_alert')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                rfmFilter === 'credit_alert'
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'text-amber-800 hover:bg-amber-50'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Nợ sắp chạm trần ({customers.filter((c) => c.currentDebt >= c.creditLimit * 0.85).length})</span>
            </button>
          </div>

          <div className="text-xs text-slate-500">
            Hiển thị <strong>{filteredRfmCustomers.length}</strong> khách hàng phù hợp bộ lọc
          </div>
        </div>

        {/* RFM Customer Interactive Grid/List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRfmCustomers.slice(0, 6).map((c) => {
            const isVip = c.rfmSegment === 'VIP';
            const isAtRisk = c.rfmSegment === 'At Risk';
            const debtUsagePercent = Math.round((c.currentDebt / (c.creditLimit || 1)) * 100);

            return (
              <div
                key={c.id}
                className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                  isAtRisk
                    ? 'bg-rose-50/40 border-rose-200 hover:border-rose-300'
                    : isVip
                    ? 'bg-amber-50/30 border-amber-200 hover:border-amber-300'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div>
                  {/* Top line with segment badge */}
                  <div className="flex items-center justify-between gap-1 mb-1.5">
                    <span className="text-xs font-mono font-bold text-slate-400">{c.code || c.id}</span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full font-mono uppercase ${
                        isAtRisk
                          ? 'bg-rose-600 text-white'
                          : isVip
                          ? 'bg-amber-500 text-slate-950'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {isAtRisk ? '🚨 Cần ghé ngay' : isVip ? '⭐ VIP' : '🚗 Ổn định'}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-slate-900 truncate">{c.name}</h4>
                  <p className="text-xs text-slate-500 truncate mt-0.5">{c.address}</p>

                  {/* Metrics block */}
                  <div className="mt-3 p-2.5 rounded-xl bg-white border border-slate-100 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Công nợ hiện tại:</span>
                      <span className="font-mono font-bold text-slate-900">{formatVND(c.currentDebt)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Mức dùng hạn mức:</span>
                      <span
                        className={`font-mono font-bold ${
                          debtUsagePercent >= 85 ? 'text-rose-600' : 'text-slate-700'
                        }`}
                      >
                        {debtUsagePercent}% ({formatVND(c.creditLimit)})
                      </span>
                    </div>
                    {c.lastPurchaseDaysAgo !== undefined && (
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-400">Lần mua gần nhất:</span>
                        <span className="font-mono font-semibold text-slate-600">
                          {c.lastPurchaseDaysAgo} ngày trước
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Quick Action Buttons: Tạo đơn gợi ý & Xem công nợ */}
                <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-2">
                  <button
                    onClick={() => onNavigate('sales-pwa')}
                    className="flex-1 py-1.5 px-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1 transition-colors cursor-pointer"
                    title="Mở giao diện lên đơn và gợi ý mặt hàng phù hợp"
                  >
                    <ShoppingCart className="w-3.5 h-3.5" />
                    <span>Tạo đơn gợi ý</span>
                  </button>
                  <button
                    onClick={() => onNavigate('customers')}
                    className="py-1.5 px-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center gap-1 transition-colors cursor-pointer"
                    title="Xem chi tiết lịch sử đối soát công nợ"
                  >
                    <Receipt className="w-3.5 h-3.5" />
                    <span>Công nợ</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* View All Customers link */}
        <div className="pt-2 flex items-center justify-between text-xs text-slate-500 border-t border-slate-100">
          <span>Xem phân tích chi tiết sức khỏe tài chính và điều chỉnh hạn mức tín dụng khách hàng</span>
          <button
            onClick={() => onNavigate('customers')}
            className="text-amber-700 hover:text-amber-800 font-bold flex items-center gap-1 cursor-pointer"
          >
            <span>Đến phân hệ Quản lý Khách hàng &amp; Công nợ</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 1-Click Zalo Direct Chat Notification Modal */}
      <ZaloShareModal
        isOpen={Boolean(zaloTarget)}
        onClose={() => setZaloTarget(null)}
        customer={zaloTarget?.customer}
        initialTemplate={zaloTarget?.template}
      />
    </div>
  );
}
