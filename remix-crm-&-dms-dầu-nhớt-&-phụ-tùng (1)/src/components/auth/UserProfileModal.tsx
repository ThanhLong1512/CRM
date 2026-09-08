'use client';

import {
  User,
  ShieldCheck,
  Mail,
  Phone,
  Building,
  Clock,
  KeyRound,
  LogOut,
  X,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { AuthUser } from '../../types';
import { DEMO_USERS } from './authData';
import { soundFX } from '../../utils/audio';

interface UserProfileModalProps {
  isOpen: boolean;
  currentUser: AuthUser;
  onClose: () => void;
  onSwitchUser: (user: AuthUser) => void;
  onOpenChangePassword: () => void;
  onRequestLogout: () => void;
}

export default function UserProfileModal({
  isOpen,
  currentUser,
  onClose,
  onSwitchUser,
  onOpenChangePassword,
  onRequestLogout,
}: UserProfileModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        id="user-profile-modal"
        className="w-full max-w-lg bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]"
      >
        {/* Top Header */}
        <div className="p-5 pb-3 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-amber-400 flex items-center justify-center font-bold text-sm font-mono shadow-xs">
              {currentUser.name
                .split(' ')
                .map((n) => n[0])
                .slice(-2)
                .join('')}
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                Hồ Sơ Nhân Sự DMS
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Mã định danh: <span className="font-mono font-bold text-slate-800">{currentUser.id}</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Main User Card */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 text-white shadow-md relative overflow-hidden">
            <div className="flex items-start justify-between">
              <div>
                <span
                  className={`inline-block text-[10px] font-mono font-bold px-2 py-0.5 rounded-full uppercase mb-2 ${
                    currentUser.role === 'director'
                      ? 'bg-amber-500 text-slate-950'
                      : currentUser.role === 'accountant'
                      ? 'bg-sky-400 text-slate-950'
                      : 'bg-emerald-400 text-slate-950'
                  }`}
                >
                  {currentUser.role === 'director'
                    ? 'Quản Trị Viên'
                    : currentUser.role === 'accountant'
                    ? 'Kế Toán Trưởng'
                    : 'Sales Thực Địa'}
                </span>
                <h4 className="text-lg font-black text-white">{currentUser.name}</h4>
                <p className="text-xs text-amber-400 font-medium mt-0.5">
                  {currentUser.roleTitle}
                </p>
              </div>

              <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center border border-white/20">
                <User className="w-6 h-6 text-amber-300" />
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-white/15 grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-1.5 text-slate-300 truncate">
                <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="truncate">{currentUser.email}</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-300">
                <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="font-mono">{currentUser.phone}</span>
              </div>
            </div>
          </div>

          {/* Department & Warehouse details */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 flex items-center gap-1.5 font-medium">
                <Building className="w-3.5 h-3.5 text-slate-600" />
                <span>Phòng ban:</span>
              </span>
              <span className="font-bold text-slate-900">{currentUser.department}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 flex items-center gap-1.5 font-medium">
                <ShieldCheck className="w-3.5 h-3.5 text-slate-600" />
                <span>Kho phụ trách:</span>
              </span>
              <span className="font-bold text-slate-900">{currentUser.assignedWarehouse}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 flex items-center gap-1.5 font-medium">
                <Clock className="w-3.5 h-3.5 text-slate-600" />
                <span>Đăng nhập gần nhất:</span>
              </span>
              <span className="font-mono font-bold text-emerald-700">
                {currentUser.lastLogin || 'Vừa xong'}
              </span>
            </div>
          </div>

          {/* RBAC Permissions Badges */}
          <div className="space-y-2">
            <h5 className="text-xs font-bold text-slate-600 uppercase tracking-wider">
              Phân Quyền Vận Hành (RBAC Matrix)
            </h5>
            <div className="grid grid-cols-2 gap-2">
              <div
                className={`p-2 rounded-xl text-xs flex items-center gap-2 border ${
                  currentUser.permissions.canApproveCredit
                    ? 'bg-emerald-50 text-emerald-900 border-emerald-200 font-semibold'
                    : 'bg-slate-100 text-slate-400 border-slate-200 line-through'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span>Duyệt nợ khẩn cấp</span>
              </div>

              <div
                className={`p-2 rounded-xl text-xs flex items-center gap-2 border ${
                  currentUser.permissions.canViewCostPrice
                    ? 'bg-emerald-50 text-emerald-900 border-emerald-200 font-semibold'
                    : 'bg-slate-100 text-slate-400 border-slate-200 line-through'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span>Xem giá vốn sản phẩm</span>
              </div>

              <div
                className={`p-2 rounded-xl text-xs flex items-center gap-2 border ${
                  currentUser.permissions.canCreateOrders
                    ? 'bg-emerald-50 text-emerald-900 border-emerald-200 font-semibold'
                    : 'bg-slate-100 text-slate-400 border-slate-200 line-through'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span>Lên đơn hàng thực địa</span>
              </div>

              <div
                className={`p-2 rounded-xl text-xs flex items-center gap-2 border ${
                  currentUser.permissions.canExportReports
                    ? 'bg-emerald-50 text-emerald-900 border-emerald-200 font-semibold'
                    : 'bg-slate-100 text-slate-400 border-slate-200 line-through'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span>Xuất báo cáo tài chính</span>
              </div>
            </div>
          </div>

          {/* Quick Switch Demo User Persona */}
          <div className="p-3.5 rounded-2xl bg-amber-50/60 border border-amber-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>Chuyển nhanh vai trò khác:</span>
              </span>
              <span className="text-[10px] font-mono text-amber-800">1-Click Switch</span>
            </div>

            <div className="grid grid-cols-3 gap-1.5">
              {DEMO_USERS.map((u) => {
                const isCurrent = currentUser.id === u.id;
                return (
                  <button
                    key={u.id}
                    onClick={() => {
                      if (!isCurrent) {
                        soundFX.playClick();
                        onSwitchUser(u);
                      }
                    }}
                    className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                      isCurrent
                        ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-amber-100/50'
                    }`}
                  >
                    <div className="text-[9px] uppercase font-mono truncate">
                      {u.role === 'sales'
                        ? 'Sales'
                        : u.role === 'accountant'
                        ? 'Kế Toán'
                        : 'Giám Đốc'}
                    </div>
                    <div className="text-xs font-bold truncate mt-0.5">{u.name}</div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer Actions: Change password & Logout */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3">
          <button
            onClick={() => {
              soundFX.playClick();
              onOpenChangePassword();
            }}
            className="h-11 px-4 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-800 font-bold text-xs flex items-center gap-2 cursor-pointer transition-colors"
          >
            <KeyRound className="w-4 h-4 text-slate-600" />
            <span>Đổi Mật Khẩu</span>
          </button>

          <button
            onClick={() => {
              soundFX.playClick();
              onRequestLogout();
            }}
            className="h-11 px-5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-extrabold text-xs flex items-center gap-2 border border-rose-200 cursor-pointer transition-colors"
          >
            <LogOut className="w-4 h-4 text-rose-600" />
            <span>Đăng Xuất</span>
          </button>
        </div>
      </div>
    </div>
  );
}
