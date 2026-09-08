import { useState, useMemo } from 'react';
import { Customer, CustomerType } from '../types';
import { formatVND } from '../mockData';
import {
  Users,
  Search,
  Building2,
  Wrench,
  Truck,
  MapPin,
  ShieldAlert,
  ShieldCheck,
  Lock,
  ArrowRight,
  Plus,
  Phone,
  Calendar,
  Package,
  CreditCard,
  CheckCircle2,
  Navigation,
  Sliders,
  DollarSign,
  AlertOctagon,
} from 'lucide-react';

interface CustomersViewProps {
  customers: Customer[];
  onUpdateCreditLimit: (customerId: string, newLimit: number) => void;
  onNavigateToSales: (customerId: string) => void;
}

export default function CustomersView({
  customers,
  onUpdateCreditLimit,
  onNavigateToSales,
}: CustomersViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedRoute, setSelectedRoute] = useState<string>('all');

  // Credit Limit Edit Modal State
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [newLimitInput, setNewLimitInput] = useState<number>(0);
  const [approvalReason, setApprovalReason] = useState<string>('Hạn mức định kỳ quý 3');

  // Customer Type details & avatar
  const getTypeMeta = (type: CustomerType) => {
    switch (type) {
      case 'Đại lý':
        return {
          label: 'DEALER / Đại Lý',
          icon: Building2,
          badgeBg: 'bg-amber-100 text-amber-900 border-amber-300',
          avatarBg: 'bg-amber-500 text-slate-950',
        };
      case 'Đội xe':
        return {
          label: 'FLEET / Đội Xe',
          icon: Truck,
          badgeBg: 'bg-blue-100 text-blue-900 border-blue-300',
          avatarBg: 'bg-blue-600 text-white',
        };
      case 'Thợ':
        return {
          label: 'GARAGE / Thợ Máy',
          icon: Wrench,
          badgeBg: 'bg-purple-100 text-purple-900 border-purple-300',
          avatarBg: 'bg-purple-600 text-white',
        };
    }
  };

  // Filtered List
  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      const matchSearch =
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.code && c.code.toLowerCase().includes(searchTerm.toLowerCase())) ||
        c.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.phone && c.phone.includes(searchTerm));
      const matchType = selectedType === 'all' || c.type === selectedType;
      const matchRoute = selectedRoute === 'all' || c.route.includes(selectedRoute);
      return matchSearch && matchType && matchRoute;
    });
  }, [customers, searchTerm, selectedType, selectedRoute]);

  // Overall Financial Stats
  const totalCreditLimit = customers.reduce((sum, c) => sum + c.creditLimit, 0);
  const totalCurrentDebt = customers.reduce((sum, c) => sum + c.currentDebt, 0);
  const overallUtilization = Math.round((totalCurrentDebt / (totalCreditLimit || 1)) * 100);
  const overLimitCount = customers.filter(
    (c) => c.currentDebt > c.creditLimit || c.currentDebt / (c.creditLimit || 1) >= 0.85
  ).length;

  const handleOpenLimitModal = (c: Customer) => {
    setEditingCustomer(c);
    setNewLimitInput(c.creditLimit);
    setApprovalReason('Tăng hạn mức mùa vụ vận tải & cao điểm bảo dưỡng');
  };

  const handleSaveLimit = () => {
    if (!editingCustomer) return;
    onUpdateCreditLimit(editingCustomer.id, newLimitInput);
    setEditingCustomer(null);
  };

  return (
    <div id="customers-view" className="p-6 max-w-7xl mx-auto space-y-6">
      {/* 1. Header & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">
              Quản Lý Khách Hàng &amp; Hạn Mức Công Nợ
            </h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold border border-emerald-300">
              Credit Limit Guard
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Kiểm soát an toàn tài chính 3 cấp (Garage, Fleet vận tải, Dealer), tọa độ định vị GPS Geofence và chu kỳ đặt hàng
          </p>
        </div>
      </div>

      {/* 2. Top Metric Cards: Credit Health & Security */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 font-medium">Tổng Công Nợ Thị Trường Đang Treo</div>
          <div className="mt-1 text-2xl font-extrabold text-slate-900 font-mono">
            {formatVND(totalCurrentDebt)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Tổng hạn mức cấp duyệt: <strong>{formatVND(totalCreditLimit)}</strong>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Tỷ Lệ Khai Thác Hạn Mức (Debt Ratio)</span>
            <span
              className={`font-mono font-bold ${
                overallUtilization > 80 ? 'text-amber-600' : 'text-emerald-600'
              }`}
            >
              {overallUtilization}%
            </span>
          </div>
          <div className="mt-2 w-full bg-slate-100 rounded-full h-2 overflow-hidden">
            <div
              className={`h-full rounded-full ${
                overallUtilization > 85
                  ? 'bg-rose-500'
                  : overallUtilization > 60
                  ? 'bg-amber-500'
                  : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.min(100, overallUtilization)}%` }}
            />
          </div>
          <div className="text-[11px] text-slate-400 mt-1.5 flex items-center justify-between">
            <span>Mức an toàn ngành dầu nhớt &lt; 75%</span>
            <span className="text-emerald-600 font-semibold">Khả dụng: {formatVND(totalCreditLimit - totalCurrentDebt)}</span>
          </div>
        </div>

        <div
          className={`p-4 rounded-xl border shadow-xs ${
            overLimitCount > 0
              ? 'bg-amber-50/70 border-amber-200 text-amber-900'
              : 'bg-white border-slate-200 text-slate-900'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-medium">
            <span>Cảnh Báo Chạm Trần &gt;85%</span>
            <ShieldAlert className="w-4 h-4 text-amber-600" />
          </div>
          <div className="mt-1 text-2xl font-extrabold font-mono text-amber-800">
            {overLimitCount} Điểm Bán
          </div>
          <div className="text-[11px] text-amber-700 mt-1">
            Cần đối soát thanh toán trước khi xuất thêm đơn phuy
          </div>
        </div>
      </div>

      {/* 3. Search and Filters Toolbar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 flex-1 min-w-[280px]">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm theo tên garage, mã khách hàng, số điện thoại, địa chỉ đường..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs placeholder:text-slate-400 focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Filter by Type */}
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 bg-white focus:outline-none focus:border-amber-500 cursor-pointer"
          >
            <option value="all">Tất cả phân loại</option>
            <option value="Đại lý">Đại lý &amp; NPP Cấp 1</option>
            <option value="Đội xe">Đội xe Logistics (FLEET)</option>
            <option value="Thợ">Garage &amp; Thợ máy (Thế chân)</option>
          </select>

          {/* Filter by Route */}
          <select
            value={selectedRoute}
            onChange={(e) => setSelectedRoute(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 bg-white focus:outline-none focus:border-amber-500 cursor-pointer"
          >
            <option value="all">Tất cả tuyến bán hàng</option>
            <option value="Tuyến T2">Tuyến T2 (Q7 - Nhà Bè - Bình Chánh)</option>
            <option value="Tuyến T3">Tuyến T3 (Tân Bình - Vĩnh Lộc)</option>
            <option value="Tuyến T4">Tuyến T4 (Q3 - Q10 - Phú Nhuận)</option>
          </select>
        </div>
      </div>

      {/* 4. Customer Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredCustomers.map((c) => {
          const typeMeta = getTypeMeta(c.type);
          const Icon = typeMeta.icon;
          const ratio = Math.round((c.currentDebt / (c.creditLimit || 1)) * 100);
          const remainingCredit = Math.max(0, c.creditLimit - c.currentDebt);
          const isLocked = c.currentDebt >= c.creditLimit;
          const isWarning = ratio >= 85 && !isLocked;

          return (
            <div
              key={c.id}
              id={`customer-card-${c.id}`}
              className="bg-white rounded-xl border border-slate-200 shadow-xs hover:shadow-md transition-all p-5 flex flex-col justify-between"
            >
              <div>
                {/* Header: Avatar, Name, Type Badge */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-xs ${typeMeta.avatarBg}`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-[11px] font-bold px-1.5 py-0.2 bg-slate-100 text-slate-700 rounded border border-slate-200">
                          {c.code || c.id}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${typeMeta.badgeBg}`}
                        >
                          {typeMeta.label}
                        </span>
                        {c.rfmSegment === 'VIP' && (
                          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 border border-amber-300">
                            ⭐ VIP
                          </span>
                        )}
                        {c.rfmSegment === 'At Risk' && (
                          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-rose-100 text-rose-800 border border-rose-300">
                            🚨 Nguy cơ rời bỏ
                          </span>
                        )}
                      </div>
                      <h3 className="font-bold text-slate-900 text-base mt-1 leading-snug">
                        {c.name}
                      </h3>
                      <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>{c.phone || 'Chưa cập nhật SĐT'}</span>
                        <span className="text-slate-300">&bull;</span>
                        <span className="text-slate-500 truncate max-w-[220px]">{c.route}</span>
                      </div>
                    </div>
                  </div>

                  {/* GPS Geofence Pin Badge */}
                  <div className="shrink-0 text-right">
                    {c.hasGps ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-semibold">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        <span>Đã cắm GPS</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200 text-[10px]">
                        <span>Chưa có GPS</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Address */}
                <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{c.address}</span>
                </div>

                {/* Credit Limit Guard (Thước đo sức khỏe tài chính) */}
                <div className="mt-4 p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/60 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 font-semibold text-slate-700">
                      <CreditCard className="w-3.5 h-3.5 text-slate-500" />
                      <span>Hạn Mức Công Nợ &amp; Dư Nợ:</span>
                    </div>
                    <div className="font-mono text-xs font-bold">
                      <span
                        className={
                          isLocked
                            ? 'text-rose-700'
                            : isWarning
                            ? 'text-amber-700'
                            : 'text-slate-800'
                        }
                      >
                        {formatVND(c.currentDebt)}
                      </span>
                      <span className="text-slate-400 font-normal"> / {formatVND(c.creditLimit)}</span>
                    </div>
                  </div>

                  {/* Progress Utilization Bar */}
                  <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        isLocked
                          ? 'bg-rose-600 animate-pulse'
                          : isWarning
                          ? 'bg-amber-500'
                          : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min(100, ratio)}%` }}
                    />
                  </div>

                  {/* Details subtext */}
                  <div className="flex items-center justify-between text-[11px] pt-0.5">
                    <span className="text-slate-500">
                      Tỷ lệ nợ: <strong className="font-mono text-slate-700">{ratio}%</strong>
                    </span>
                    {isLocked ? (
                      <span className="font-bold text-rose-700 flex items-center gap-1">
                        <Lock className="w-3 h-3" /> KHÓA NỢ: Vượt hạn mức
                      </span>
                    ) : isWarning ? (
                      <span className="font-bold text-amber-700 flex items-center gap-1">
                        <AlertOctagon className="w-3 h-3" /> Cảnh báo: Còn {formatVND(remainingCredit)}
                      </span>
                    ) : (
                      <span className="text-emerald-700 font-medium">
                        Còn được mua tiếp: <strong>{formatVND(remainingCredit)}</strong>
                      </span>
                    )}
                  </div>
                </div>

                {/* Additional Stats: Drums & Cycle */}
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2 rounded-lg bg-white border border-slate-200 flex items-center justify-between">
                    <span className="text-slate-500 flex items-center gap-1 text-[11px]">
                      <Package className="w-3.5 h-3.5 text-cyan-600" /> Vỏ phuy 200L:
                    </span>
                    <span className="font-mono font-bold text-cyan-900">
                      {c.emptyDrums || 0} phuy
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-white border border-slate-200 flex items-center justify-between">
                    <span className="text-slate-500 flex items-center gap-1 text-[11px]">
                      <Calendar className="w-3.5 h-3.5 text-amber-600" /> Chu kỳ đặt:
                    </span>
                    <span className="font-mono font-bold text-slate-800">
                      {c.avgCycleDays ? `${c.avgCycleDays} ngày/lần` : 'Định kỳ'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  onClick={() => handleOpenLimitModal(c)}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Sliders className="w-3.5 h-3.5 text-slate-500" />
                  <span>Sửa Hạn Mức</span>
                </button>

                <button
                  onClick={() => onNavigateToSales(c.id)}
                  className="px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
                >
                  <span>Lên Đơn PWA</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* 5. Credit Limit Adjustment Modal */}
      {editingCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h4 className="font-bold text-slate-900 text-base">
                  Điều Chỉnh Hạn Mức Công Nợ
                </h4>
                <p className="text-xs text-slate-500">Khách hàng: {editingCustomer.name}</p>
              </div>
              <span className="p-2 rounded-lg bg-amber-50 text-amber-700 font-bold text-xs font-mono">
                {editingCustomer.code || editingCustomer.id}
              </span>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Hạn mức công nợ hiện tại:
                </label>
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-800">
                  {formatVND(editingCustomer.creditLimit)}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Hạn mức công nợ mới (VNĐ) *:
                </label>
                <input
                  type="number"
                  step="5000000"
                  min="0"
                  value={newLimitInput}
                  onChange={(e) => setNewLimitInput(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm font-mono font-bold focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                />
                <div className="text-[11px] text-slate-500 mt-1 font-mono">
                  Bằng chữ: <strong>{formatVND(newLimitInput)}</strong>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Lý do phê duyệt điều chỉnh:
                </label>
                <input
                  type="text"
                  value={approvalReason}
                  onChange={(e) => setApprovalReason(e.target.value)}
                  placeholder="Nhập lý do bảo lãnh hoặc tăng định mức kinh doanh..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs"
                />
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900">
                Lưu ý: Thay đổi hạn mức sẽ ngay lập tức áp dụng vào chốt chặn bán hàng PWA và cảnh báo công nợ thời gian thực.
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setEditingCustomer(null)}
                className="px-4 py-2 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleSaveLimit}
                className="px-5 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold shadow-xs cursor-pointer"
              >
                Xác Nhận Cập Nhật
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
