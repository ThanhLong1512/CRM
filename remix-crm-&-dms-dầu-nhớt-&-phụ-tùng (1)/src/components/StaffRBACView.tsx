import { useState } from 'react';
import { SalesStaff } from '../types';
import { INITIAL_SALES_STAFF, formatVND } from '../mockData';
import {
  ShieldCheck,
  Users,
  MapPin,
  CheckCircle2,
  Calendar,
  DollarSign,
  Lock,
  Unlock,
  Edit,
  Shield,
  Award,
  TrendingUp,
  UserPlus,
  Compass,
} from 'lucide-react';

export default function StaffRBACView() {
  const [staffList, setStaffList] = useState<SalesStaff[]>(INITIAL_SALES_STAFF);
  const [editingStaff, setEditingStaff] = useState<SalesStaff | null>(null);
  const [permissionsState, setPermissionsState] = useState(
    INITIAL_SALES_STAFF[0].permissions
  );

  const handleOpenPermissions = (staff: SalesStaff) => {
    setEditingStaff(staff);
    setPermissionsState({ ...staff.permissions });
  };

  const handleSavePermissions = () => {
    if (!editingStaff) return;
    setStaffList((prev) =>
      prev.map((s) =>
        s.id === editingStaff.id ? { ...s, permissions: { ...permissionsState } } : s
      )
    );
    setEditingStaff(null);
  };

  return (
    <div id="staff-rbac-view" className="p-6 max-w-7xl mx-auto space-y-6">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">
              Quản Lý Nhân Sự Sales &amp; Phân Quyền RBAC Thực Địa
            </h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-900 text-amber-400 font-bold font-mono">
              RBAC v2.4
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Phân bổ tuyến bán hàng, giám sát KPI thực địa theo thời gian thực và phân quyền duyệt ngoại lệ (Vượt nợ, Chiết khấu, GPS)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>3 Nhân sự đang đi tuyến thực địa</span>
          </div>
        </div>
      </div>

      {/* 2. Staff Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {staffList.map((staff) => {
          const visitRatio = Math.round(
            (staff.todayVisits.completed / staff.todayVisits.total) * 100
          );
          const revenueRatio = Math.round(
            (staff.mtdRevenue / (staff.mtdTarget || 1)) * 100
          );

          return (
            <div
              key={staff.id}
              id={`staff-card-${staff.id}`}
              className="bg-white rounded-xl border border-slate-200 shadow-xs hover:shadow-md transition-all p-5 flex flex-col justify-between"
            >
              <div>
                {/* Header Profile */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-900 to-slate-800 text-amber-400 font-bold text-base flex items-center justify-center font-mono shadow-xs border border-slate-700">
                      {staff.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-xs font-bold text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200">
                          {staff.code}
                        </span>
                        <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-semibold border border-emerald-200">
                          Đang hoạt động
                        </span>
                      </div>
                      <h3 className="font-bold text-slate-900 text-base mt-0.5">{staff.name}</h3>
                      <div className="text-xs text-slate-500">{staff.role}</div>
                    </div>
                  </div>
                </div>

                {/* Assigned Route */}
                <div className="mt-4 p-2.5 rounded-lg bg-slate-50 border border-slate-200/70 text-xs flex items-center gap-2">
                  <Compass className="w-4 h-4 text-amber-600 shrink-0" />
                  <div className="min-w-0">
                    <div className="text-[10px] text-slate-400 uppercase font-semibold">Tuyến phụ trách:</div>
                    <div className="font-semibold text-slate-800 truncate">{staff.assignedRoute}</div>
                  </div>
                </div>

                {/* Realtime KPI Progress Bars */}
                <div className="mt-4 space-y-3">
                  {/* KPI 1: Today Visits */}
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-slate-500 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Điểm viếng thăm hôm nay:
                      </span>
                      <span className="font-mono font-bold text-slate-800">
                        {staff.todayVisits.completed} / {staff.todayVisits.total} ({visitRatio}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-emerald-500 h-full rounded-full transition-all"
                        style={{ width: `${Math.min(100, visitRatio)}%` }}
                      />
                    </div>
                  </div>

                  {/* KPI 2: MTD Sales Target */}
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-slate-500 flex items-center gap-1">
                        <TrendingUp className="w-3.5 h-3.5 text-amber-600" /> Doanh số tháng (MTD):
                      </span>
                      <span className="font-mono font-bold text-slate-800">
                        {revenueRatio}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-amber-500 h-full rounded-full transition-all"
                        style={{ width: `${Math.min(100, revenueRatio)}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1 font-mono">
                      <span>Đạt: {formatVND(staff.mtdRevenue)}</span>
                      <span>Chỉ tiêu: {formatVND(staff.mtdTarget)}</span>
                    </div>
                  </div>

                  {/* Debt Collected */}
                  <div className="p-2.5 rounded-lg bg-emerald-50/70 border border-emerald-200/80 flex items-center justify-between text-xs">
                    <span className="text-emerald-800 font-medium">Thu hồi nợ thực địa:</span>
                    <span className="font-mono font-bold text-emerald-950">
                      {formatVND(staff.debtCollected)}
                    </span>
                  </div>

                  {/* Last Check-in Location */}
                  {staff.lastCheckIn && (
                    <div className="text-[11px] text-slate-500 flex items-center gap-1.5 pt-1">
                      <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                      <span className="truncate">
                        Vị trí gần nhất: <strong>{staff.lastCheckIn.customerName}</strong> ({staff.lastCheckIn.time})
                      </span>
                    </div>
                  )}
                </div>

                {/* Active Permissions Summary Pills */}
                <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5">
                  <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                    Quyền hạn ngoại lệ:
                  </div>
                  <div className="flex flex-wrap gap-1 text-[10px]">
                    {staff.permissions.approveOverCredit ? (
                      <span className="px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200 font-semibold flex items-center gap-1">
                        <Unlock className="w-2.5 h-2.5" /> Duyệt vượt nợ
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-400">
                        Khóa duyệt nợ
                      </span>
                    )}

                    {staff.permissions.drumOffset && (
                      <span className="px-2 py-0.5 rounded bg-cyan-50 text-cyan-800 border border-cyan-200 font-semibold">
                        Cấn trừ vỏ phuy
                      </span>
                    )}

                    {staff.permissions.createSpecialPromo && (
                      <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 font-semibold">
                        Tặng nhớt ngoài CT
                      </span>
                    )}

                    {staff.permissions.editGpsCoords && (
                      <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200 font-semibold">
                        Chỉnh tọa độ GPS
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="mt-4 pt-3 border-t border-slate-100">
                <button
                  onClick={() => handleOpenPermissions(staff)}
                  className="w-full py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-slate-600" />
                  <span>Cấu Hình Ma Trận Phân Quyền</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. Permission Matrix Grid Modal */}
      {editingStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h4 className="font-bold text-slate-900 text-base flex items-center gap-2">
                  <Shield className="w-4 h-4 text-amber-600" />
                  <span>Ma Trận Phân Quyền RBAC Thực Địa</span>
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Nhân sự: <strong>{editingStaff.name}</strong> ({editingStaff.code})
                </p>
              </div>
              <span className="text-xs font-mono px-2 py-1 bg-slate-100 rounded text-slate-600 font-bold">
                {editingStaff.role}
              </span>
            </div>

            {/* Checkbox Options Grid */}
            <div className="space-y-3">
              <label className="flex items-start gap-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={permissionsState.approveOverCredit}
                  onChange={(e) =>
                    setPermissionsState({
                      ...permissionsState,
                      approveOverCredit: e.target.checked,
                    })
                  }
                  className="mt-0.5 rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
                />
                <div>
                  <div className="text-xs font-bold text-slate-900">
                    Quyền duyệt đơn vượt trần công nợ (Over-Credit Approval)
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Cho phép chốt đơn hàng và chuyển sang thủ kho ngay cả khi khách hàng đã chạm trần &gt;100% nợ
                  </div>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={permissionsState.createSpecialPromo}
                  onChange={(e) =>
                    setPermissionsState({
                      ...permissionsState,
                      createSpecialPromo: e.target.checked,
                    })
                  }
                  className="mt-0.5 rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
                />
                <div>
                  <div className="text-xs font-bold text-slate-900">
                    Quyền tạo khuyến mãi / Tặng nhớt ngoài danh mục
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Tùy biến chiết khấu thêm hoặc tặng kèm can 1L/4L cho garage chiến lược
                  </div>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={permissionsState.editGpsCoords}
                  onChange={(e) =>
                    setPermissionsState({
                      ...permissionsState,
                      editGpsCoords: e.target.checked,
                    })
                  }
                  className="mt-0.5 rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
                />
                <div>
                  <div className="text-xs font-bold text-slate-900">
                    Quyền cập nhật tọa độ GPS Geofence khách hàng
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Cắm lại mốc vị trí cửa hàng thực địa khi garage dời địa điểm hoặc cập nhật lần đầu
                  </div>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={permissionsState.drumOffset}
                  onChange={(e) =>
                    setPermissionsState({
                      ...permissionsState,
                      drumOffset: e.target.checked,
                    })
                  }
                  className="mt-0.5 rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
                />
                <div>
                  <div className="text-xs font-bold text-slate-900">
                    Quyền cấn trừ nợ bằng vỏ phuy sắt 200L (Drum Credit Offset)
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Quy đổi số lượng vỏ phuy thu hồi thành tiền cọc trừ thẳng vào công nợ đơn hàng
                  </div>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={permissionsState.viewCostPrice}
                  onChange={(e) =>
                    setPermissionsState({
                      ...permissionsState,
                      viewCostPrice: e.target.checked,
                    })
                  }
                  className="mt-0.5 rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
                />
                <div>
                  <div className="text-xs font-bold text-slate-900">
                    Quyền xem giá gốc nhập kho &amp; biên lợi nhuận
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Hiển thị thông tin giá vốn trên từng xô/phuy (chỉ cấp cho Quản lý / Giám đốc)
                  </div>
                </div>
              </label>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setEditingStaff(null)}
                className="px-4 py-2 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleSavePermissions}
                className="px-5 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold shadow-xs cursor-pointer"
              >
                Lưu Phân Quyền
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
