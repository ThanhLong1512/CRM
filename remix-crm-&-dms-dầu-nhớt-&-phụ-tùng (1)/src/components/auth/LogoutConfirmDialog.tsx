'use client';

import { LogOut, AlertTriangle, X } from 'lucide-react';
import { AuthUser } from '../../types';
import { soundFX } from '../../utils/audio';

interface LogoutConfirmDialogProps {
  isOpen: boolean;
  currentUser: AuthUser;
  pendingOfflineCount?: number;
  onClose: () => void;
  onConfirmLogout: () => void;
}

export default function LogoutConfirmDialog({
  isOpen,
  currentUser,
  pendingOfflineCount = 0,
  onClose,
  onConfirmLogout,
}: LogoutConfirmDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        id="logout-confirm-dialog"
        className="w-full max-w-md bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150"
      >
        {/* Header with Warning Accent */}
        <div className="p-5 pb-3 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 border border-rose-100">
              <LogOut className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                Xác Nhận Đăng Xuất
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Ca làm việc của: <strong className="text-slate-800">{currentUser.name}</strong>
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

        {/* Content Body */}
        <div className="p-5 pt-2 space-y-3 text-slate-600 text-xs sm:text-sm">
          <p className="leading-relaxed">
            Bạn có chắc chắn muốn đăng xuất khỏi hệ thống DMS? Mọi phiên làm việc và bảo mật phân quyền của bạn sẽ được khóa an toàn.
          </p>

          {/* Pending Offline Orders Warning */}
          {pendingOfflineCount > 0 && (
            <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-2.5 text-amber-900 text-xs">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-bold">Lưu ý đơn hàng ngoại tuyến:</strong>
                <span>
                  Hiện còn <strong className="text-amber-700">{pendingOfflineCount} đơn hàng</strong> trong hàng đợi chưa đồng bộ lên máy chủ. Bạn nên bấm Đồng Bộ trước khi đăng xuất nếu dùng chung thiết bị.
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2.5">
          <button
            onClick={() => {
              soundFX.playClick();
              onClose();
            }}
            className="h-11 px-5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs sm:text-sm transition-colors cursor-pointer"
          >
            Ở Lại Tiếp Tục
          </button>

          <button
            id="confirm-logout-button"
            onClick={() => {
              soundFX.playWarning();
              onConfirmLogout();
            }}
            className="h-11 px-5 rounded-xl bg-rose-600 hover:bg-rose-500 active:scale-95 text-white font-black text-xs sm:text-sm flex items-center gap-1.5 shadow-md shadow-rose-600/20 transition-all cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Đăng Xuất Ngay</span>
          </button>
        </div>
      </div>
    </div>
  );
}
