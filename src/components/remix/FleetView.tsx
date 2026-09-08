"use client";
import { useState, FormEvent } from 'react';
import { FleetVehicle, Customer } from '../types';
import {
  Truck,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Plus,
  ArrowRight,
  Droplets,
  Edit2,
  Gauge,
  Calendar,
  X,
  ShieldAlert,
  Fuel,
  Trash2,
} from 'lucide-react';

interface FleetViewProps {
  vehicles: FleetVehicle[];
  customers: Customer[];
  onNavigateToSales: (customerId: string) => void;
  onUpdateVehicleKm: (
    vehicleId: string,
    currentKm: number,
    nextOilChangeKm: number
  ) => void;
  onAddVehicle: (newVehicle: FleetVehicle) => void;
  onDeleteVehicle?: (vehicleId: string) => void;
}

export default function FleetView({
  vehicles,
  customers,
  onNavigateToSales,
  onUpdateVehicleKm,
  onAddVehicle,
  onDeleteVehicle,
}: FleetViewProps) {
  // Vehicle edit state
  const [editingVehicleId, setEditingVehicleId] = useState<string | null>(null);
  const [tempCurrentKm, setTempCurrentKm] = useState<number>(0);
  const [tempNextOilKm, setTempNextOilKm] = useState<number>(0);

  // Add Vehicle Modal
  const [showAddForm, setShowAddForm] = useState(false);
  const [newPlate, setNewPlate] = useState('');
  const [newCustomerId, setNewCustomerId] = useState(customers[1]?.id || customers[0]?.id || '');
  const [newVehicleType, setNewVehicleType] = useState('Xe tải nặng 10 tấn (Hino 500)');
  const [newKm, setNewKm] = useState<number>(7500);
  const [newNextKm, setNewNextKm] = useState<number>(10000);
  const [newRecommendedOil, setNewRecommendedOil] = useState('Dầu động cơ Turbo Diesel 15W-40 (Cần 18 Lít)');

  // Overview Counts
  const redVehicles = vehicles.filter((v) => v.currentKm > v.nextOilChangeKm || v.status === 'Đỏ');
  const yellowVehicles = vehicles.filter(
    (v) => v.nextOilChangeKm - v.currentKm <= 500 && v.currentKm <= v.nextOilChangeKm
  );
  const greenVehicles = vehicles.filter(
    (v) => v.nextOilChangeKm - v.currentKm > 500
  );

  const handleStartEdit = (v: FleetVehicle) => {
    setEditingVehicleId(v.id);
    setTempCurrentKm(v.currentKm);
    setTempNextOilKm(v.nextOilChangeKm);
  };

  const handleSaveEdit = (vehicleId: string) => {
    onUpdateVehicleKm(vehicleId, tempCurrentKm, tempNextOilKm);
    setEditingVehicleId(null);
  };

  const handleAddSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!newPlate.trim()) return;

    let status: 'Xanh' | 'Vàng' | 'Đỏ' = 'Xanh';
    if (newKm > newNextKm) {
      status = 'Đỏ';
    } else if (newNextKm - newKm <= 500) {
      status = 'Vàng';
    }

    const customer = customers.find((c) => c.id === newCustomerId);

    const newVehicle: FleetVehicle = {
      id: `V${(vehicles.length + 1).toString().padStart(2, '0')}`,
      customerId: newCustomerId,
      customerName: customer?.name || 'Đội Xe Đối Tác',
      vehicleType: newVehicleType,
      plate: newPlate.trim().toUpperCase(),
      currentKm: newKm,
      nextOilChangeKm: newNextKm,
      recommendedOil: newRecommendedOil,
      status,
      oilLifePercent: Math.max(0, Math.round(((newNextKm - newKm) / 10000) * 100)),
    };

    onAddVehicle(newVehicle);
    setShowAddForm(false);
    setNewPlate('');
  };

  return (
    <div id="fleet-view" className="w-full space-y-6">
      {/* 1. Header */}
      <div className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs sm:flex-row sm:items-center">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-extrabold tracking-tight text-slate-900 sm:text-2xl">
              Quản Trị Đội Xe &amp; Dự Báo Chu Kỳ Dầu Nhớt
            </h2>
            <span className="rounded-full border border-blue-300 bg-blue-100 px-2.5 py-0.5 text-xs font-bold text-blue-900">
              Dự Báo Hao Mòn
            </span>
          </div>
          <p className="mt-0.5 text-xs text-slate-500">
            Giám sát Odometer km hành trình, tự động tính toán thời hạn bảo dưỡng và gợi ý định lượng dầu động cơ (Lít)
          </p>
        </div>

        <button
          onClick={() => setShowAddForm(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-xs font-bold text-slate-950 shadow-xs cursor-pointer hover:bg-amber-600"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm Đầu Xe Mới</span>
        </button>
      </div>

      {/* 2. Top 3 Status Severity Health Blocks */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* RED BLOCK */}
        <div className="p-5 rounded-2xl bg-rose-50 border border-rose-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-rose-800 text-xs font-bold uppercase tracking-wider">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-ping" />
              <span>ĐÈN ĐỎ &bull; Quá Hạn Thay Nhớt</span>
            </div>
            <div className="mt-2 text-3xl font-black font-mono text-rose-700">
              {redVehicles.length} Đầu Xe
            </div>
            <div className="text-[11px] text-rose-600 font-medium mt-1">
              Nguy cơ bó kẹt máy &bull; Cần lên đơn khẩn cấp
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-rose-200/80 text-rose-700 flex items-center justify-center text-xl font-bold">
            🚨
          </div>
        </div>

        {/* YELLOW BLOCK */}
        <div className="p-5 rounded-2xl bg-amber-50 border border-amber-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-amber-800 text-xs font-bold uppercase tracking-wider">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span>ĐÈN VÀNG &bull; Cảnh Báo Sớm (&lt;500 km)</span>
            </div>
            <div className="mt-2 text-3xl font-black font-mono text-amber-800">
              {yellowVehicles.length} Đầu Xe
            </div>
            <div className="text-[11px] text-amber-700 font-medium mt-1">
              Sales cần gọi điện đặt trước xô/phuy
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-200/80 text-amber-800 flex items-center justify-center text-xl font-bold">
            ⚠️
          </div>
        </div>

        {/* GREEN BLOCK */}
        <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-emerald-800 text-xs font-bold uppercase tracking-wider">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span>ĐÈN XANH &bull; Tình Trạng An Toàn</span>
            </div>
            <div className="mt-2 text-3xl font-black font-mono text-emerald-800">
              {greenVehicles.length} Đầu Xe
            </div>
            <div className="text-[11px] text-emerald-700 font-medium mt-1">
              Dầu nhớt đang trong chu kỳ bảo vệ tối ưu
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-200/80 text-emerald-800 flex items-center justify-center text-xl font-bold">
            ✅
          </div>
        </div>
      </div>

      {/* 3. Fleet Vehicles Detailed Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {vehicles.map((v) => {
          const isOverdue = v.currentKm > v.nextOilChangeKm;
          const remainingKm = v.nextOilChangeKm - v.currentKm;
          const isWarning = remainingKm <= 500 && !isOverdue;

          // Remaining oil life percentage
          const oilLife = isOverdue
            ? 0
            : Math.min(100, Math.max(0, Math.round((remainingKm / (v.nextOilChangeKm || 10000)) * 100)));

          const customer = customers.find((c) => c.id === v.customerId);

          return (
            <div
              key={v.id}
              id={`fleet-card-${v.id}`}
              className={`rounded-2xl border p-5 flex flex-col justify-between shadow-xs transition-all ${
                isOverdue
                  ? 'bg-white border-rose-300 shadow-rose-100'
                  : isWarning
                  ? 'bg-white border-amber-300 shadow-amber-100'
                  : 'bg-white border-slate-200'
              }`}
            >
              <div>
                {/* Plate & Status Pill */}
                <div className="flex items-start justify-between">
                  <div>
                    {/* Vietnamese Vehicle Plate Graphic */}
                    <div className="inline-block px-3 py-1 bg-white border-2 border-slate-800 rounded-md font-mono text-base font-extrabold text-slate-900 tracking-wider shadow-2xs">
                      {v.plate}
                    </div>
                    <div className="text-xs font-semibold text-slate-700 mt-1.5">
                      {v.vehicleType}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Chủ xe: <strong>{customer?.name || v.customerName}</strong>
                    </div>
                  </div>

                  {/* Status Indicator */}
                  {isOverdue ? (
                    <span className="px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 border border-rose-300 text-[10px] font-bold animate-pulse">
                      QUÁ HẠN {Math.abs(remainingKm)} KM
                    </span>
                  ) : isWarning ? (
                    <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-bold">
                      CÒN {remainingKm} KM
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px] font-bold">
                      AN TOÀN ({remainingKm} KM)
                    </span>
                  )}
                </div>

                {/* Oil Life Remaining Gauge (Thanh Tiến Trình Hao Mòn Dầu Nhớt) */}
                <div className="mt-4 p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-600 flex items-center gap-1">
                      <Gauge className="w-3.5 h-3.5 text-slate-400" />
                      <span>Tuổi thọ dầu nhớt còn lại:</span>
                    </span>
                    <span
                      className={`font-mono font-bold text-sm ${
                        isOverdue
                          ? 'text-rose-600'
                          : isWarning
                          ? 'text-amber-600'
                          : 'text-emerald-600'
                      }`}
                    >
                      {oilLife}%
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        isOverdue
                          ? 'bg-rose-500'
                          : isWarning
                          ? 'bg-amber-500'
                          : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.max(4, oilLife)}%` }}
                    />
                  </div>

                  {/* Odometer numbers */}
                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 pt-0.5">
                    <span>Odometer: <strong>{v.currentKm.toLocaleString()} km</strong></span>
                    <span>Chu kỳ: <strong>{v.nextOilChangeKm.toLocaleString()} km</strong></span>
                  </div>
                </div>

                {/* Gợi Ý Loại Nhớt Phù Hợp Đóng Đinh Dưới Biển Số */}
                <div className="mt-3 p-3 rounded-xl bg-blue-50/70 border border-blue-200/80 flex items-start gap-2 text-xs">
                  <Droplets className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[10px] uppercase font-bold text-blue-700 tracking-wide block">
                      Khuyến Nghị Nhớt Động Cơ:
                    </span>
                    <span className="font-semibold text-blue-950 leading-tight block mt-0.5">
                      {v.recommendedOil || 'Dầu động cơ Turbo Diesel 15W-40 (Cần 18 Lít)'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleStartEdit(v)}
                    className="px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-slate-500" />
                    <span>Cập Nhật Km</span>
                  </button>
                  {onDeleteVehicle && (
                    <button
                      type="button"
                      onClick={() => {
                        if (
                          window.confirm(
                            `Xóa đầu xe ${v.plate}? Hành động không hoàn tác.`,
                          )
                        ) {
                          onDeleteVehicle(v.id);
                        }
                      }}
                      className="px-2.5 py-1.5 rounded-lg border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                      title="Xóa đầu xe"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Xóa</span>
                    </button>
                  )}
                </div>

                {isOverdue || isWarning ? (
                  <button
                    onClick={() => onNavigateToSales(v.customerId)}
                    className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-1 shadow-2xs transition-colors cursor-pointer"
                  >
                    <span>Tạo Đơn Nhớt Gấp</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button
                    onClick={() => onNavigateToSales(v.customerId)}
                    className="px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold flex items-center gap-1 shadow-2xs transition-colors cursor-pointer"
                  >
                    <span>Lên Đơn Định Kỳ</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Inline Km Update Modal */}
      {editingVehicleId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 space-y-4">
            <h4 className="font-bold text-slate-900 text-sm">
              Cập Nhật Km Đồng Hồ Odometer
            </h4>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Số Km hiện tại trên đồng hồ (km):
                </label>
                <input
                  type="number"
                  value={tempCurrentKm}
                  onChange={(e) => setTempCurrentKm(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Mốc Km thay dầu tiếp theo (km):
                </label>
                <input
                  type="number"
                  value={tempNextOilKm}
                  onChange={(e) => setTempNextOilKm(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm font-mono font-bold"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setEditingVehicleId(null)}
                className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Hủy
              </button>
              <button
                onClick={() => handleSaveEdit(editingVehicleId)}
                className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold"
              >
                Lưu Thay Đổi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Vehicle Modal */}
      {showAddForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h4 className="font-bold text-slate-900 text-base">
                Thêm Đầu Xe Mới Vào Đội Quản Trị
              </h4>
              <button onClick={() => setShowAddForm(false)} className="text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Biển số xe (Ví dụ: 51C-123.45) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="51C-..."
                  value={newPlate}
                  onChange={(e) => setNewPlate(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm font-mono font-bold uppercase"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Doanh nghiệp sở hữu / Đội xe *
                </label>
                <select
                  value={newCustomerId}
                  onChange={(e) => setNewCustomerId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
                >
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.type})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Loại phương tiện
                </label>
                <input
                  type="text"
                  value={newVehicleType}
                  onChange={(e) => setNewVehicleType(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Số Km hiện tại
                  </label>
                  <input
                    type="number"
                    value={newKm}
                    onChange={(e) => setNewKm(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Mốc thay nhớt
                  </label>
                  <input
                    type="number"
                    value={newNextKm}
                    onChange={(e) => setNewNextKm(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Khuyến nghị loại nhớt &amp; Dung tích (Lít)
                </label>
                <input
                  type="text"
                  value={newRecommendedOil}
                  onChange={(e) => setNewRecommendedOil(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold"
                >
                  Lưu Đầu Xe
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
