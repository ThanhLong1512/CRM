"use client";
import { useState, FormEvent } from 'react';
import {
  Settings,
  Shield,
  MapPin,
  Package,
  Coins,
  Database,
  Building,
  Save,
  CheckCircle2,
  RefreshCw,
  Percent,
  Palette,
  Sun,
  Moon,
  Laptop,
  Check,
  Globe,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { useTranslation } from '@/components/providers/language-provider';
import { SUPPORTED_LANGUAGES } from '@/lib/i18n/translations';
import { soundFX } from '@/components/utils/audio';
import { formatVND } from '../mockData';

export default function SettingsView() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const { language, setLanguage, t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'general' | 'geofence' | 'credit' | 'drums' | 'loyalty' | 'offline' | 'appearance'>('general');
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Configuration state
  const [config, setConfig] = useState({
    companyName: 'Công Ty TNHH Phân Phối Dầu Nhớt Remix Petro',
    hotline: '1900 6868',
    centralWarehouseAddress: 'Kho Tổng QL1A, Huyện Bình Chánh, TP. Hồ Chí Minh',
    geofenceRadiusMeters: 50,
    requirePhotoAtCheckin: true,
    gpsAccuracyThresholdMeters: 30,
    defaultCreditLimit: 100000000,
    overdueWarningDays: 30,
    creditLockOverdueDays: 45,
    drumDepositPrice: 400000,
    maxDrumHoldDays: 45,
    loyaltyPointConversionRate: 10000, // 10.000đ = 1 point
    rewardPointsPerDrum: 20,
    offlineAutoSyncIntervalMin: 5,
    vatRatePercent: 8,
  });

  const handleSave = (e: FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div id="settings-view-root" className="space-y-6">
      {/* Top Banner / Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-amber-500/15 text-amber-600 flex items-center justify-center shrink-0">
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Cấu Hình & Tham Số Nghiệp Vụ</h2>
            <p className="text-xs text-slate-500">
              Thiết lập quy tắc kinh doanh, chính sách bán hàng B2B, geofencing GPS và luân chuyển vỏ phuy
            </p>
          </div>
        </div>

        {savedSuccess && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Đã lưu cấu hình thành công!</span>
          </div>
        )}
      </div>

      {/* Settings Navigation Tabs */}
      <div className="flex overflow-x-auto gap-2 pb-2 border-b border-slate-200 scrollbar-none">
        {[
          { id: 'general', label: 'Doanh Nghiệp & Kho', icon: Building },
          { id: 'geofence', label: 'GPS & Geofencing (50m)', icon: MapPin },
          { id: 'credit', label: 'Hạn Mức & Công Nợ', icon: Shield },
          { id: 'drums', label: 'Vỏ Phuy 200L', icon: Package },
          { id: 'loyalty', label: 'Tích Điểm Thợ Máy', icon: Coins },
          { id: 'offline', label: 'Offline-First & Bộ Nhớ', icon: Database },
          { id: 'appearance', label: 'Giao Diện & Ngôn Ngữ', icon: Palette },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'bg-[#0F172A] text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-amber-400' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main Settings Form */}
      <form onSubmit={handleSave} className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6">
        {/* Tab 1: General Info */}
        {activeTab === 'general' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider text-amber-600">
              Thông Tin Đơn Vị Phân Phối
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Tên công ty / NPP</label>
                <input
                  type="text"
                  value={config.companyName}
                  onChange={(e) => setConfig({ ...config, companyName: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Hotline Kỹ Thuật & Đặt Hàng</label>
                <input
                  type="text"
                  value={config.hotline}
                  onChange={(e) => setConfig({ ...config, hotline: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-amber-500"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">Địa chỉ Kho Trung Tâm</label>
                <input
                  type="text"
                  value={config.centralWarehouseAddress}
                  onChange={(e) => setConfig({ ...config, centralWarehouseAddress: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Thuế suất VAT mặc định (%)</label>
                <div className="relative">
                  <input
                    type="number"
                    value={config.vatRatePercent}
                    onChange={(e) => setConfig({ ...config, vatRatePercent: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-amber-500"
                  />
                  <Percent className="w-4 h-4 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Geofence GPS */}
        {activeTab === 'geofence' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider text-amber-600">
              Quy Chuẩn Định Vị Thực Địa (Geofencing)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Bán kính Check-in hợp lệ (Meters)
                </label>
                <input
                  type="number"
                  value={config.geofenceRadiusMeters}
                  onChange={(e) => setConfig({ ...config, geofenceRadiusMeters: Number(e.target.value) })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-amber-500 font-mono font-bold"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Mặc định 50m. Sales chỉ được mở khóa tính năng Lên đơn hàng khi tọa độ thiết bị nằm trong bán kính này.
                </p>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Ngưỡng sai số GPS tối đa cho phép (Meters)
                </label>
                <input
                  type="number"
                  value={config.gpsAccuracyThresholdMeters}
                  onChange={(e) => setConfig({ ...config, gpsAccuracyThresholdMeters: Number(e.target.value) })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-amber-500 font-mono font-bold"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Nếu tín hiệu GPS điện thoại chập chờn quá 30m, hệ thống cảnh báo yêu cầu di chuyển ra ngoài trời.
                </p>
              </div>
              <div className="md:col-span-2 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.requirePhotoAtCheckin}
                    onChange={(e) => setConfig({ ...config, requirePhotoAtCheckin: e.target.checked })}
                    className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
                  />
                  <span className="text-xs font-bold text-slate-800">
                    Bắt buộc chụp ảnh biển hiệu Garage / Cửa hàng tại thời điểm Check-in
                  </span>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Credit Guard */}
        {activeTab === 'credit' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider text-amber-600">
              Chính Sách Hạn Mức & Khóa Công Nợ
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Hạn mức tín dụng mặc định cho Khách hàng mới (VNĐ)
                </label>
                <input
                  type="number"
                  step="10000000"
                  value={config.defaultCreditLimit}
                  onChange={(e) => setConfig({ ...config, defaultCreditLimit: Number(e.target.value) })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-amber-500 font-mono font-bold"
                />
                <p className="text-[11px] text-amber-600 font-mono mt-1 font-semibold">
                  Tương đương: {formatVND(config.defaultCreditLimit)}
                </p>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Ngưỡng cảnh báo công nợ sắp đến hạn (Số ngày)
                </label>
                <input
                  type="number"
                  value={config.overdueWarningDays}
                  onChange={(e) => setConfig({ ...config, overdueWarningDays: Number(e.target.value) })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-amber-500 font-mono font-bold"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Đơn chưa thanh toán quá 30 ngày sẽ gắn cờ Cảnh Báo Vàng trên Bảng RFM và Danh sách Khách hàng.
                </p>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Ngưỡng KHÓA LÊN ĐƠN do quá hạn (Số ngày)
                </label>
                <input
                  type="number"
                  value={config.creditLockOverdueDays}
                  onChange={(e) => setConfig({ ...config, creditLockOverdueDays: Number(e.target.value) })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-amber-500 font-mono font-bold text-rose-600"
                />
                <p className="text-[11px] text-rose-600 mt-1 font-medium">
                  Chặn hoàn toàn lên đơn mới trên PWA nếu nợ quá hạn {config.creditLockOverdueDays} ngày (chỉ Giám Đốc mới duyệt được).
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Drums Return Policy */}
        {activeTab === 'drums' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider text-amber-600">
              Quy Chế Luân Chuyển & Tiền Cọc Vỏ Phuy 200L
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Đơn giá cọc vỏ phuy 200L rỗng (VNĐ / Phuy)
                </label>
                <input
                  type="number"
                  step="50000"
                  value={config.drumDepositPrice}
                  onChange={(e) => setConfig({ ...config, drumDepositPrice: Number(e.target.value) })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-amber-500 font-mono font-bold"
                />
                <p className="text-[11px] text-amber-600 font-mono mt-1 font-semibold">
                  Tương đương: {formatVND(config.drumDepositPrice)} / vỏ phuy
                </p>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Thời hạn tối đa lưu giữ vỏ phuy tại Garage (Ngày)
                </label>
                <input
                  type="number"
                  value={config.maxDrumHoldDays}
                  onChange={(e) => setConfig({ ...config, maxDrumHoldDays: Number(e.target.value) })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-amber-500 font-mono font-bold"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Quá {config.maxDrumHoldDays} ngày chưa thu hồi vỏ, hệ thống sẽ tự động hạch toán cọc vào công nợ phải thu.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tab 5: Mechanic Loyalty Points */}
        {activeTab === 'loyalty' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider text-amber-600">
              Cơ Chế Tích Điểm Thợ Sửa Xe (QR Loyalty)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tỷ lệ quy đổi điểm thưởng (VNĐ mua hàng = 1 điểm)
                </label>
                <input
                  type="number"
                  step="1000"
                  value={config.loyaltyPointConversionRate}
                  onChange={(e) => setConfig({ ...config, loyaltyPointConversionRate: Number(e.target.value) })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-amber-500 font-mono font-bold"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Cứ mỗi {formatVND(config.loyaltyPointConversionRate)} doanh số dầu nhớt thợ máy tiêu thụ được cộng 1 điểm tích lũy.
                </p>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Điểm thưởng khuyến khích khi đổi vỏ phuy rỗng (Điểm / Vỏ)
                </label>
                <input
                  type="number"
                  value={config.rewardPointsPerDrum}
                  onChange={(e) => setConfig({ ...config, rewardPointsPerDrum: Number(e.target.value) })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-amber-500 font-mono font-bold"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Thợ sửa xe gom và bàn giao lại 1 vỏ phuy 200L nguyên vẹn được thưởng {config.rewardPointsPerDrum} điểm.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tab 6: Offline-First Configuration */}
        {activeTab === 'offline' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider text-amber-600">
              Kiến Trúc Offline-First & Đồng Bộ Cục Bộ
            </h3>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2 text-slate-700">
              <div className="flex items-center justify-between font-bold text-slate-900">
                <span>Dung lượng bộ nhớ Cache IndexedDB hiện tại:</span>
                <span className="font-mono text-emerald-600">2.4 MB / 50 MB khả dụng</span>
              </div>
              <p className="text-slate-500">
                Toàn bộ Master Data (50+ sản phẩm dầu nhớt, 35 khách hàng, tọa độ GPS, lịch sử bảo dưỡng đội xe) được lưu sẵn trong bộ nhớ trình duyệt điện thoại để Sales thao tác không cần sóng 4G.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Chu kỳ tự động thử đồng bộ nền khi có mạng (Phút)
                </label>
                <input
                  type="number"
                  value={config.offlineAutoSyncIntervalMin}
                  onChange={(e) => setConfig({ ...config, offlineAutoSyncIntervalMin: Number(e.target.value) })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-amber-500 font-mono font-bold"
                />
              </div>
            </div>
          </div>
        )}

        {/* Tab 7: Appearance & Dark Mode */}
        {activeTab === 'appearance' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider text-amber-600 dark:text-amber-400">
                Giao Diện & Chế Độ Hiển Thị (Dark Mode)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Tùy chỉnh phong cách hiển thị sáng hoặc tối để tối ưu khả năng quan sát và bảo vệ mắt khi làm việc ban đêm hoặc thực địa.
              </p>
            </div>

            {/* Theme Select Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                {
                  id: 'light',
                  label: 'Chế độ Sáng (Light)',
                  desc: 'Nền slate thanh lịch, độ tương phản cao, tối ưu khi làm việc nơi có ánh sáng mặt trời mạnh',
                  icon: Sun,
                  accent: 'border-amber-500 bg-amber-500/10 text-amber-600',
                  previewBg: 'bg-[#f8fafc] text-slate-900 border-slate-200',
                },
                {
                  id: 'dark',
                  label: 'Chế độ Tối (Dark)',
                  desc: 'Nền than tối cao cấp, chống mỏi mắt, tiết kiệm pin cho điện thoại và máy tính bảng thực địa',
                  icon: Moon,
                  accent: 'border-indigo-500 bg-indigo-500/10 text-indigo-400',
                  previewBg: 'bg-[#090d16] text-slate-100 border-slate-800',
                },
                {
                  id: 'system',
                  label: 'Theo Hệ Thống (Auto)',
                  desc: 'Tự động đồng bộ giao diện theo cài đặt sáng/tối của hệ điều hành thiết bị',
                  icon: Laptop,
                  accent: 'border-sky-500 bg-sky-500/10 text-sky-500',
                  previewBg: 'bg-gradient-to-r from-[#f8fafc] to-[#090d16] text-slate-800 border-slate-400',
                },
              ].map((item) => {
                const Icon = item.icon;
                const isSelected = theme === item.id;
                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      soundFX.playClick();
                      setTheme(item.id);
                    }}
                    className={`relative p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'border-amber-500 bg-amber-500/5 shadow-md shadow-amber-500/10 dark:bg-amber-950/20'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div className={`p-2 rounded-xl ${item.accent}`}>
                          <Icon className="size-5" />
                        </div>
                        {isSelected && (
                          <span className="flex items-center gap-1 text-[11px] font-bold text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/40 px-2 py-0.5 rounded-full">
                            <Check className="size-3" /> Đang dùng
                          </span>
                        )}
                      </div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">{item.label}</h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">{item.desc}</p>
                    </div>

                    {/* Mini Visual Preview Mockup */}
                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80">
                      <div className={`p-2 rounded-lg border text-[10px] font-mono flex items-center justify-between ${item.previewBg}`}>
                        <span>Aa Demo Giao diện</span>
                        <span className="px-1.5 py-0.5 rounded bg-amber-500 text-slate-950 font-bold text-[9px]">Dầu nhớt</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Live Palette Token Visualizer */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Bảng màu trực quan đang áp dụng ({resolvedTheme === 'dark' ? 'Dark Mode' : 'Light Mode'})
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold">
                  NextThemes Active
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-mono">
                <div className="p-2.5 rounded-xl bg-background border border-border text-foreground flex flex-col justify-between">
                  <span className="text-[9px] text-muted-foreground">Background</span>
                  <span className="font-bold mt-1 truncate">var(--background)</span>
                </div>
                <div className="p-2.5 rounded-xl bg-card border border-border text-card-foreground flex flex-col justify-between">
                  <span className="text-[9px] text-muted-foreground">Card Surface</span>
                  <span className="font-bold mt-1 truncate">var(--card)</span>
                </div>
                <div className="p-2.5 rounded-xl bg-amber-500 text-slate-950 flex flex-col justify-between shadow-xs">
                  <span className="text-[9px] opacity-80">Primary Accent</span>
                  <span className="font-bold mt-1 truncate">Amber #F59E0B</span>
                </div>
                <div className="p-2.5 rounded-xl bg-muted border border-border text-muted-foreground flex flex-col justify-between">
                  <span className="text-[9px]">Muted Element</span>
                  <span className="font-bold mt-1 truncate">var(--muted)</span>
                </div>
              </div>
            </div>

            {/* Language Selection Section */}
            <div className="pt-6 border-t border-slate-200 dark:border-slate-800 space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-2">
                  <Globe className="size-4" />
                  <span>{t("languageTitle")} &amp; Bản Địa Hóa (Localization)</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Chọn ngôn ngữ hiển thị giao diện cho toàn bộ hệ thống bán hàng, điều phối kho vận và kế toán.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {SUPPORTED_LANGUAGES.map((opt) => {
                  const isSelected = language === opt.code;
                  return (
                    <div
                      key={opt.code}
                      onClick={() => {
                        soundFX.playClick();
                        setLanguage(opt.code);
                      }}
                      className={`relative p-3.5 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? 'border-amber-500 bg-amber-500/10 shadow-sm text-slate-950 dark:text-white dark:bg-amber-950/20'
                          : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{opt.flag}</span>
                        <div>
                          <div className="text-xs font-bold text-slate-900 dark:text-slate-100">
                            {opt.nativeLabel}
                          </div>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono uppercase">
                            {opt.code} &bull; {opt.label}
                          </div>
                        </div>
                      </div>
                      {isSelected && (
                        <div className="size-5 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center">
                          <Check className="size-3 stroke-[3]" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Bottom Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-200">
          <button
            type="button"
            onClick={() => {
              // Reset to defaults
              setConfig({
                companyName: 'Công Ty TNHH Phân Phối Dầu Nhớt Remix Petro',
                hotline: '1900 6868',
                centralWarehouseAddress: 'Kho Tổng QL1A, Huyện Bình Chánh, TP. Hồ Chí Minh',
                geofenceRadiusMeters: 50,
                requirePhotoAtCheckin: true,
                gpsAccuracyThresholdMeters: 30,
                defaultCreditLimit: 100000000,
                overdueWarningDays: 30,
                creditLockOverdueDays: 45,
                drumDepositPrice: 400000,
                maxDrumHoldDays: 45,
                loyaltyPointConversionRate: 10000,
                rewardPointsPerDrum: 20,
                offlineAutoSyncIntervalMin: 5,
                vatRatePercent: 8,
              });
            }}
            className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Khôi phục mặc định</span>
          </button>

          <button
            type="submit"
            className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 text-xs font-extrabold flex items-center gap-2 shadow-md shadow-amber-500/20 transition-all cursor-pointer font-mono"
          >
            <Save className="w-4 h-4" />
            <span>LƯU CẤU HÌNH THAY ĐỔI</span>
          </button>
        </div>
      </form>
    </div>
  );
}
