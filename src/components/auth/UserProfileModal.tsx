"use client";

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
} from "lucide-react";
import type { AuthUserProfile } from "@/components/auth/authData";
import { soundFX } from "@/components/utils/audio";

type UserProfileModalProps = {
  isOpen: boolean;
  currentUser: AuthUserProfile;
  onClose: () => void;
  onOpenChangePassword: () => void;
  onRequestLogout: () => void;
};

export default function UserProfileModal({
  isOpen,
  currentUser,
  onClose,
  onOpenChangePassword,
  onRequestLogout,
}: UserProfileModalProps) {
  if (!isOpen) return null;

  const initials = currentUser.name
    .split(" ")
    .map((n) => n[0])
    .slice(-2)
    .join("");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-xs">
      <div className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 p-5 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 font-mono text-sm font-bold text-amber-400 shadow-xs">
              {initials}
            </div>
            <div>
              <h3 className="text-base font-black leading-tight text-slate-900 sm:text-lg">
                Hồ Sơ Nhân Sự DMS
              </h3>
              <p className="text-xs font-medium text-slate-500">
                Mã:{" "}
                <span className="font-mono font-bold text-slate-800">
                  {currentUser.id.slice(0, 12)}
                </span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-slate-100 text-slate-400 hover:text-slate-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-5">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 p-4 text-white shadow-md">
            <div className="flex items-start justify-between">
              <div>
                <span
                  className={`mb-2 inline-block rounded-full px-2 py-0.5 font-mono text-[10px] font-bold uppercase ${
                    currentUser.role === "director"
                      ? "bg-amber-500 text-slate-950"
                      : currentUser.role === "accountant"
                        ? "bg-sky-400 text-slate-950"
                        : "bg-emerald-400 text-slate-950"
                  }`}
                >
                  {currentUser.role === "director"
                    ? "Quản Trị Viên"
                    : currentUser.role === "accountant"
                      ? "Kế Toán Trưởng"
                      : "Sales Thực Địa"}
                </span>
                <h4 className="text-lg font-black text-white">
                  {currentUser.name}
                </h4>
                <p className="mt-0.5 text-xs font-medium text-amber-400">
                  {currentUser.roleTitle}
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-white/10">
                <User className="h-6 w-6 text-amber-300" />
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2 border-t border-white/15 pt-3 text-xs">
              <div className="flex items-center gap-1.5 truncate text-slate-300">
                <Mail className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                <span className="truncate">{currentUser.email}</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-300">
                <Phone className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                <span className="font-mono">{currentUser.phone}</span>
              </div>
            </div>
          </div>

          <div className="space-y-2 rounded-2xl border border-slate-200 bg-slate-50 p-3.5 text-xs">
            <div className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-1.5 font-medium text-slate-500">
                <Building className="h-3.5 w-3.5 text-slate-600" />
                Phòng ban
              </span>
              <span className="text-right font-bold text-slate-900">
                {currentUser.department}
              </span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-1.5 font-medium text-slate-500">
                <ShieldCheck className="h-3.5 w-3.5 text-slate-600" />
                Kho phụ trách
              </span>
              <span className="text-right font-bold text-slate-900">
                {currentUser.assignedWarehouse}
              </span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-1.5 font-medium text-slate-500">
                <Clock className="h-3.5 w-3.5 text-slate-600" />
                Đăng nhập
              </span>
              <span className="font-mono font-bold text-emerald-700">
                {currentUser.lastLogin || "Vừa xong"}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <h5 className="text-xs font-bold tracking-wider text-slate-600 uppercase">
              Phân quyền vận hành
            </h5>
            <div className="grid grid-cols-2 gap-2">
              {(
                [
                  ["canApproveCredit", "Duyệt nợ khẩn cấp"],
                  ["canViewCostPrice", "Xem giá vốn"],
                  ["canCreateOrders", "Lên đơn hàng"],
                  ["canExportReports", "Xuất báo cáo"],
                ] as const
              ).map(([key, label]) => {
                const on = currentUser.permissions[key];
                return (
                  <div
                    key={key}
                    className={`flex items-center gap-2 rounded-xl border p-2 text-xs ${
                      on
                        ? "border-emerald-200 bg-emerald-50 font-semibold text-emerald-900"
                        : "border-slate-200 bg-slate-100 text-slate-400 line-through"
                    }`}
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                    <span>{label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-slate-100 bg-slate-50 p-4">
          <button
            type="button"
            onClick={() => {
              soundFX.playClick();
              onOpenChangePassword();
            }}
            className="flex h-11 cursor-pointer items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 text-xs font-bold text-slate-800 hover:bg-slate-100"
          >
            <KeyRound className="h-4 w-4 text-slate-600" />
            <span>Đổi Mật Khẩu</span>
          </button>
          <button
            type="button"
            onClick={() => {
              soundFX.playClick();
              onRequestLogout();
            }}
            className="flex h-11 cursor-pointer items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-5 text-xs font-extrabold text-rose-700 hover:bg-rose-100"
          >
            <LogOut className="h-4 w-4 text-rose-600" />
            <span>Đăng Xuất</span>
          </button>
        </div>
      </div>
    </div>
  );
}
