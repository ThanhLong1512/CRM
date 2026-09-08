"use client";

import { LogOut, AlertTriangle, X } from "lucide-react";
import type { AuthUserProfile } from "@/components/auth/authData";
import { soundFX } from "@/components/utils/audio";

type LogoutConfirmDialogProps = {
  isOpen: boolean;
  currentUser: AuthUserProfile;
  pendingOfflineCount?: number;
  onClose: () => void;
  onConfirmLogout: () => void;
};

export default function LogoutConfirmDialog({
  isOpen,
  currentUser,
  pendingOfflineCount = 0,
  onClose,
  onConfirmLogout,
}: LogoutConfirmDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-xs">
      <div className="w-full max-w-md overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-start justify-between p-5 pb-3">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-rose-100 bg-rose-50 text-rose-600">
              <LogOut className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-black leading-tight text-slate-900 sm:text-lg">
                Xác Nhận Đăng Xuất
              </h3>
              <p className="mt-0.5 text-xs text-slate-500">
                Ca làm việc của:{" "}
                <strong className="text-slate-800">{currentUser.name}</strong>
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

        <div className="space-y-3 p-5 pt-2 text-xs text-slate-600 sm:text-sm">
          <p className="leading-relaxed">
            Bạn có chắc chắn muốn đăng xuất khỏi hệ thống DMS? Mọi phiên làm
            việc sẽ được khóa an toàn.
          </p>
          {pendingOfflineCount > 0 && (
            <div className="flex items-start gap-2.5 rounded-2xl border border-amber-200 bg-amber-50 p-3.5 text-xs text-amber-900">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
              <div>
                <strong className="block font-bold">
                  Lưu ý đơn hàng ngoại tuyến:
                </strong>
                <span>
                  Còn{" "}
                  <strong className="text-amber-700">
                    {pendingOfflineCount} đơn
                  </strong>{" "}
                  chưa đồng bộ. Nên sync trước khi đăng xuất nếu dùng chung thiết
                  bị.
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2.5 border-t border-slate-100 bg-slate-50 p-4">
          <button
            type="button"
            onClick={() => {
              soundFX.playClick();
              onClose();
            }}
            className="h-11 cursor-pointer rounded-xl border border-slate-300 bg-white px-5 text-xs font-bold text-slate-700 hover:bg-slate-100 sm:text-sm"
          >
            Ở Lại Tiếp Tục
          </button>
          <button
            type="button"
            onClick={() => {
              soundFX.playWarning();
              onConfirmLogout();
            }}
            className="flex h-11 cursor-pointer items-center gap-1.5 rounded-xl bg-rose-600 px-5 text-xs font-black text-white shadow-md shadow-rose-600/20 hover:bg-rose-500 sm:text-sm"
          >
            <LogOut className="h-4 w-4" />
            <span>Đăng Xuất Ngay</span>
          </button>
        </div>
      </div>
    </div>
  );
}
