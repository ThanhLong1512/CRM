"use client";

import { FormEvent, useState, useTransition } from "react";
import { Lock, Eye, EyeOff, CheckCircle2, X, KeyRound } from "lucide-react";
import { changePassword } from "@/app/auth/actions";
import { soundFX } from "@/components/utils/audio";
import { toast } from "sonner";

type ChangePasswordModalProps = {
  isOpen: boolean;
  userEmail: string;
  onClose: () => void;
  onSuccess: () => void;
};

export default function ChangePasswordModal({
  isOpen,
  userEmail,
  onClose,
  onSuccess,
}: ChangePasswordModalProps) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [pending, startTransition] = useTransition();

  if (!isOpen) return null;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    soundFX.playClick();
    const fd = new FormData();
    fd.set("currentPassword", currentPassword);
    fd.set("newPassword", newPassword);
    fd.set("confirmPassword", confirmPassword);
    startTransition(async () => {
      const result = await changePassword({ error: null }, fd);
      if (result.error) {
        setErrorMessage(result.error);
        return;
      }
      soundFX.playSuccess();
      toast.success(result.success ?? "Đã đổi mật khẩu.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      onSuccess();
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-xs">
      <div className="w-full max-w-md overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 p-5 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-amber-200 bg-amber-50 text-amber-600">
              <KeyRound className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-black leading-tight text-slate-900">
                Đổi Mật Khẩu
              </h3>
              <p className="max-w-[240px] truncate text-xs text-slate-500">
                {userEmail}
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

        <form onSubmit={handleSubmit} className="space-y-4 p-5">
          {errorMessage && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-700">
              {errorMessage}
            </div>
          )}
          <div>
            <label className="mb-1 block text-xs font-bold text-slate-700">
              Mật khẩu hiện tại
            </label>
            <div className="relative">
              <Lock className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type={showPassword ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="h-11 w-full rounded-xl border border-slate-300 pr-9 pl-10 font-mono text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute top-1/2 right-3 -translate-y-1/2 text-slate-400"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold text-slate-700">
              Mật khẩu mới
            </label>
            <div className="relative">
              <Lock className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type={showPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="h-11 w-full rounded-xl border border-slate-300 pr-3 pl-10 font-mono text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                required
                minLength={6}
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold text-slate-700">
              Xác nhận mật khẩu mới
            </label>
            <div className="relative">
              <Lock className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="h-11 w-full rounded-xl border border-slate-300 pr-3 pl-10 font-mono text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                required
              />
            </div>
          </div>
          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="h-10 cursor-pointer rounded-xl border border-slate-300 px-4 text-xs font-bold text-slate-700 hover:bg-slate-100"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={pending}
              className="flex h-10 cursor-pointer items-center gap-1.5 rounded-xl bg-amber-500 px-5 text-xs font-black text-slate-950 shadow-sm hover:bg-amber-400 disabled:opacity-60"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>Cập Nhật Mật Khẩu</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
