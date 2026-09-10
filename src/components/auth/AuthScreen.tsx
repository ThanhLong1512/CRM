"use client";

import { FormEvent, useState, useTransition } from "react";
import {
  Lock,
  Mail,
  User,
  Phone,
  Eye,
  EyeOff,
  ShieldCheck,
  Fuel,
  ArrowRight,
  ArrowLeft,
  KeyRound,
  CheckCircle2,
  Sparkles,
  RefreshCw,
} from "lucide-react";
import { login } from "@/app/login/actions";
import { signup } from "@/app/register/actions";
import { requestPasswordReset } from "@/app/auth/actions";
import {
  DEMO_PASSWORD,
  isDemoQuickLoginEmail,
  type AuthDemoRole,
  type QuickLoginUserDto,
} from "@/components/auth/authData";
import { soundFX } from "@/components/utils/audio";
import { toast } from "sonner";
import AppLogo from "@/components/common/AppLogo";

type AuthMode = "login" | "register" | "forgot";

type AuthScreenProps = {
  initialMode?: AuthMode;
  quickLoginUsers?: QuickLoginUserDto[];
};

function getPasswordStrength(pwd: string) {
  if (!pwd) return { score: 0, label: "", color: "bg-slate-200" };
  let score = 0;
  if (pwd.length >= 6) score += 1;
  if (pwd.length >= 8) score += 1;
  if (/[A-Z]/.test(pwd)) score += 1;
  if (/[0-9]/.test(pwd)) score += 1;
  if (/[^A-Za-z0-9]/.test(pwd)) score += 1;
  if (score <= 2) return { score, label: "Yếu", color: "bg-rose-500" };
  if (score <= 3) return { score, label: "Trung bình", color: "bg-amber-500" };
  return { score, label: "Rất mạnh", color: "bg-emerald-500" };
}

export default function AuthScreen({
  initialMode = "login",
  quickLoginUsers = [],
}: AuthScreenProps) {
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [pending, startTransition] = useTransition();

  const [loginEmail, setLoginEmail] = useState(quickLoginUsers[0]?.email ?? "");
  const [loginPassword, setLoginPassword] = useState(
    quickLoginUsers[0] ? DEMO_PASSWORD : "",
  );
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regRole, setRegRole] = useState<AuthDemoRole>("sales");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirmPassword, setRegConfirmPassword] = useState("");
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(true);

  const [forgotStep, setForgotStep] = useState<1 | 2>(1);
  const [forgotEmail, setForgotEmail] = useState(
    quickLoginUsers[0]?.email ?? "",
  );

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const isLoading = pending;
  const regPwdStrength = getPasswordStrength(regPassword);

  const fillQuickLogin = (user: QuickLoginUserDto) => {
    soundFX.playClick();
    setLoginEmail(user.email);
    setLoginPassword(
      isDemoQuickLoginEmail(user.email) ? DEMO_PASSWORD : "",
    );
    setErrorMessage("");
    setSuccessMessage("");
    toast.success(`Đã điền ${user.name} — bấm Đăng Nhập`);
    setMode("login");
  };

  const handleLoginSubmit = (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");
    if (!loginEmail.trim() || !loginPassword) {
      setErrorMessage("Vui lòng nhập email và mật khẩu.");
      return;
    }
    soundFX.playClick();
    const fd = new FormData();
    fd.set("email", loginEmail.trim());
    fd.set("password", loginPassword);
    startTransition(async () => {
      const result = await login({ error: null }, fd);
      if (result?.error) {
        setErrorMessage(result.error);
        return;
      }
    });
  };

  const handleRegisterSubmit = (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");
    if (!regName.trim() || !regEmail.trim() || !regPhone.trim()) {
      setErrorMessage("Vui lòng nhập họ tên, email và số điện thoại.");
      return;
    }
    if (regPassword.length < 6) {
      setErrorMessage("Mật khẩu phải có tối thiểu 6 ký tự.");
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setErrorMessage("Mật khẩu xác nhận không khớp.");
      return;
    }
    if (!agreeTerms) {
      setErrorMessage("Bạn cần đồng ý với quy chế bảo mật.");
      return;
    }
    soundFX.playClick();
    const fd = new FormData();
    fd.set("fullName", regName.trim());
    fd.set("email", regEmail.trim());
    fd.set("phone", regPhone.trim());
    fd.set("password", regPassword);
    fd.set("confirmPassword", regConfirmPassword);
    fd.set("role", regRole);
    startTransition(async () => {
      const result = await signup({ error: null }, fd);
      if (result?.error) {
        setErrorMessage(result.error);
      }
    });
  };

  const handleForgotSubmit = (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");
    if (!forgotEmail.trim()) {
      setErrorMessage("Vui lòng nhập email đã đăng ký.");
      return;
    }
    soundFX.playClick();
    const fd = new FormData();
    fd.set("email", forgotEmail.trim());
    startTransition(async () => {
      const result = await requestPasswordReset(
        { error: null, success: null },
        fd,
      );
      if (result.error) {
        setErrorMessage(result.error);
        return;
      }
      soundFX.playSuccess();
      setSuccessMessage(
        result.success ??
          "Đã gửi email khôi phục. Kiểm tra hộp thư và mở link đặt lại mật khẩu.",
      );
      setForgotStep(2);
    });
  };

  return (
    <div
      id="auth-root-container"
      className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden bg-slate-950 p-3 font-sans text-slate-100 sm:p-6 lg:p-10"
    >
      <div className="pointer-events-none absolute top-0 left-1/4 h-96 w-96 rounded-full bg-amber-500/10 blur-3xl" />
      <div className="pointer-events-none absolute right-1/4 bottom-0 h-[500px] w-[500px] rounded-full bg-sky-600/10 blur-3xl" />

      <div className="z-10 grid w-full max-w-md lg:max-w-5xl grid-cols-1 overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/90 shadow-2xl backdrop-blur-xl lg:grid-cols-12">
        <div className="relative hidden lg:flex flex-col justify-between border-b border-slate-800 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 p-6 sm:p-8 lg:col-span-5 lg:border-r lg:border-b-0 lg:p-10">
          <div>
            <AppLogo variant="login" className="mb-6" />
            <p className="mb-6 text-xs leading-relaxed font-medium text-slate-300 sm:text-sm">
              Giải pháp số hóa toàn diện kênh phân phối Dầu Nhớt &amp; Phụ Tùng
              B2B: Kiểm soát công nợ, quản lý luân chuyển vỏ phuy sắt 200L và
              điều phối Sales thực địa.
            </p>
            <div className="space-y-3">
              <div className="flex items-start gap-3 rounded-xl border border-slate-700/60 bg-slate-800/60 p-3">
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400">
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">
                    Credit Guard Bảo Vệ Hạn Mức
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Khóa đơn tự động khi vượt hạn mức, duyệt khẩn cấp qua Giám
                    Đốc.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-xl border border-slate-700/60 bg-slate-800/60 p-3">
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sky-500/10 text-sky-400">
                  <RefreshCw className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">
                    Sổ Luân Chuyển Vỏ Phuy 200L
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Khấu trừ cọc, đối soát ký nhận số lượng vỏ trả tại tiệm.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-xl border border-slate-700/60 bg-slate-800/60 p-3">
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">
                    Offline-First Thực Địa 100%
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Lên đơn ngoại tuyến, tự đồng bộ khi có sóng 4G/Wifi.
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-8 flex items-center justify-between border-t border-slate-800/80 pt-6 font-mono text-[11px] text-slate-400">
            <span>Bảo mật 256-Bit SSL</span>
            <span className="font-bold text-amber-400">Phiên bản v2.6 Pro</span>
          </div>
        </div>

        <div className="flex flex-col justify-center bg-slate-900/60 p-6 sm:p-8 lg:col-span-7 lg:p-10">
          <div className="mb-6">
            <div className="lg:hidden mb-5 flex items-center justify-center">
              <AppLogo variant="sidebar" />
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-xs font-bold tracking-widest text-amber-500 uppercase">
                {mode === "login"
                  ? "Cổng Xác Thực Đăng Nhập"
                  : mode === "register"
                    ? "Đăng Ký Tài Khoản Mới"
                    : "Khôi Phục & Quên Mật Khẩu"}
              </span>
              {mode !== "login" && (
                <button
                  type="button"
                  onClick={() => {
                    soundFX.playClick();
                    setMode("login");
                    setErrorMessage("");
                    setSuccessMessage("");
                    setForgotStep(1);
                  }}
                  className="flex cursor-pointer items-center gap-1 text-xs font-medium text-slate-400 transition-colors hover:text-white"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  <span>Quay lại đăng nhập</span>
                </button>
              )}
            </div>
            <h2 className="mt-1 text-2xl font-black tracking-tight text-white sm:text-3xl">
              {mode === "login" && "Đăng nhập vào Hệ thống"}
              {mode === "register" && "Khởi tạo tài khoản công vụ"}
              {mode === "forgot" && "Khôi phục mật khẩu tài khoản"}
            </h2>
            <p className="mt-1 text-xs text-slate-400 sm:text-sm">
              {mode === "login" &&
                "Truy cập dữ liệu kho bãi, bảng giá đại lý và tuyến thị trường"}
              {mode === "register" &&
                "Điền thông tin nhân sự để được phân quyền chức năng tương ứng"}
              {mode === "forgot" &&
                "Nhập email — hệ thống gửi link đặt lại mật khẩu qua Supabase"}
            </p>
          </div>

          {errorMessage && (
            <div className="mb-4 flex items-center gap-2 rounded-xl border border-rose-600 bg-rose-950/80 p-3 text-xs font-semibold text-rose-200">
              <span className="h-2 w-2 shrink-0 rounded-full bg-rose-400" />
              <span>{errorMessage}</span>
            </div>
          )}
          {successMessage && (
            <div className="mb-4 flex items-center gap-2 rounded-xl border border-emerald-500 bg-emerald-950/80 p-3 text-xs font-semibold text-emerald-200">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
              <span>{successMessage}</span>
            </div>
          )}

          {mode === "login" && (
            <div className="space-y-5">
              {quickLoginUsers.length > 0 && (
              <div className="space-y-2 rounded-2xl border border-slate-800 bg-slate-950/70 p-3.5">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-xs font-bold text-slate-300">
                    <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                    <span>Đăng nhập nhanh với vai trò (1 chạm):</span>
                  </span>
                  <span className="font-mono text-[10px] text-slate-500">
                    Từ hệ thống
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {quickLoginUsers.map((u) => {
                    const isSelected = loginEmail === u.email;
                    return (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => fillQuickLogin(u)}
                        className={`cursor-pointer rounded-xl border p-2 text-left transition-all ${
                          isSelected
                            ? "border-amber-500 bg-amber-500/20 text-white shadow-xs"
                            : "border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800/80"
                        }`}
                      >
                        <div className="font-mono text-[10px] font-bold text-amber-400 uppercase">
                          {u.roleLabel}
                        </div>
                        <div className="mt-0.5 truncate text-xs font-bold">
                          {u.name}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
              )}

              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-slate-300">
                    Email Công Ty hoặc Tài Khoản
                  </label>
                  <div className="relative">
                    <Mail className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="email"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="sales.anv@remixoil.vn"
                      className="h-12 w-full rounded-xl border border-slate-700 bg-slate-950 pr-4 pl-10 text-sm font-medium text-white transition-all placeholder:text-slate-500 focus:border-amber-500 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                      autoComplete="email"
                    />
                  </div>
                </div>
                <div>
                  <div className="mb-1.5 flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-300">
                      Mật khẩu
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        soundFX.playClick();
                        setMode("forgot");
                        setForgotStep(1);
                        setErrorMessage("");
                        setSuccessMessage("");
                      }}
                      className="cursor-pointer text-xs font-semibold text-amber-400 transition-colors hover:text-amber-300"
                    >
                      Quên mật khẩu?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type={showLoginPassword ? "text" : "password"}
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="Nhập mật khẩu..."
                      className="h-12 w-full rounded-xl border border-slate-700 bg-slate-950 pr-11 pl-10 font-mono text-sm font-medium text-white transition-all placeholder:text-slate-500 focus:border-amber-500 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                      className="absolute top-1/2 right-3 -translate-y-1/2 cursor-pointer p-1 text-slate-400 hover:text-slate-200"
                    >
                      {showLoginPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
                <label className="flex cursor-pointer items-center gap-2 select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 cursor-pointer rounded border-slate-700 bg-slate-950 text-amber-500 focus:ring-amber-500"
                  />
                  <span className="text-xs font-medium text-slate-300">
                    Ghi nhớ phiên đăng nhập trên máy này
                  </span>
                </label>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="mt-2 flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-amber-500 text-sm font-black text-slate-950 shadow-lg shadow-amber-500/20 transition-all hover:bg-amber-400 active:scale-[0.99] disabled:opacity-60 sm:text-base"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      <span>Đang xác thực bảo mật...</span>
                    </>
                  ) : (
                    <>
                      <span>Đăng Nhập Hệ Thống</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </form>
              <div className="pt-2 text-center">
                <span className="text-xs text-slate-400">
                  Chưa có tài khoản nhân sự?{" "}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    soundFX.playClick();
                    setMode("register");
                    setErrorMessage("");
                    setSuccessMessage("");
                  }}
                  className="cursor-pointer text-xs font-bold text-amber-400 hover:underline"
                >
                  Đăng ký tài khoản mới
                </button>
              </div>
            </div>
          )}

          {mode === "register" && (
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-slate-300">
                    Họ và tên
                  </label>
                  <div className="relative">
                    <User className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      className="h-11 w-full rounded-xl border border-slate-700 bg-slate-950 pr-3 pl-10 text-sm text-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                      placeholder="Nguyễn Văn A"
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-slate-300">
                    Số điện thoại
                  </label>
                  <div className="relative">
                    <Phone className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      className="h-11 w-full rounded-xl border border-slate-700 bg-slate-950 pr-3 pl-10 font-mono text-sm text-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                      placeholder="09xx xxx xxx"
                    />
                  </div>
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-300">
                  Email công việc
                </label>
                <div className="relative">
                  <Mail className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    className="h-11 w-full rounded-xl border border-slate-700 bg-slate-950 pr-3 pl-10 text-sm text-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    placeholder="ban@congty.vn"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-300">
                  Vai trò đăng ký
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-1.5">
                  {(
                    [
                      ["sales", "Sales Thực Địa"],
                      ["accountant", "Kế Toán Kho"],
                      ["fleet", "Đội Xe / Vận Tải"],
                      ["dealer", "Đại Lý Cấp 1"],
                      ["director", "Ban Quản Lý"],
                    ] as const
                  ).map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setRegRole(value)}
                      className={`cursor-pointer rounded-xl border px-2 py-2 text-[10.5px] font-bold ${
                        regRole === value
                          ? "border-amber-500 bg-amber-500/20 text-amber-200 shadow-sm"
                          : "border-slate-700 bg-slate-950 text-slate-400 hover:border-slate-600 hover:text-slate-200"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-slate-300">
                    Mật khẩu
                  </label>
                  <div className="relative">
                    <Lock className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type={showRegPassword ? "text" : "password"}
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      className="h-11 w-full rounded-xl border border-slate-700 bg-slate-950 pr-10 pl-10 font-mono text-sm text-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegPassword(!showRegPassword)}
                      className="absolute top-1/2 right-3 -translate-y-1/2 text-slate-400"
                    >
                      {showRegPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  {regPassword && (
                    <div className="mt-1.5 flex items-center gap-2">
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-800">
                        <div
                          className={`h-full ${regPwdStrength.color}`}
                          style={{
                            width: `${(regPwdStrength.score / 5) * 100}%`,
                          }}
                        />
                      </div>
                      <span className="text-[10px] font-bold text-slate-400">
                        {regPwdStrength.label}
                      </span>
                    </div>
                  )}
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-slate-300">
                    Xác nhận mật khẩu
                  </label>
                  <div className="relative">
                    <KeyRound className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type={showRegPassword ? "text" : "password"}
                      value={regConfirmPassword}
                      onChange={(e) => setRegConfirmPassword(e.target.value)}
                      className="h-11 w-full rounded-xl border border-slate-700 bg-slate-950 pr-3 pl-10 font-mono text-sm text-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
              <label className="flex cursor-pointer items-start gap-2 select-none">
                <input
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-slate-700 bg-slate-950 text-amber-500"
                />
                <span className="text-xs text-slate-400">
                  Đồng ý với quy chế bảo mật dữ liệu phân phối B2B của hệ thống.
                </span>
              </label>
              <button
                type="submit"
                disabled={isLoading}
                className="flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-amber-500 text-sm font-black text-slate-950 shadow-lg shadow-amber-500/20 hover:bg-amber-400 disabled:opacity-60"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Đang tạo tài khoản...</span>
                  </>
                ) : (
                  <>
                    <span>Đăng Ký &amp; Đăng Nhập Ngay</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {mode === "forgot" && (
            <div className="space-y-4">
              {forgotStep === 1 ? (
                <form onSubmit={handleForgotSubmit} className="space-y-4">
                  <div>
                    <label className="mb-1.5 block text-xs font-bold text-slate-300">
                      Email đã đăng ký
                    </label>
                    <div className="relative">
                      <Mail className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <input
                        type="email"
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        className="h-12 w-full rounded-xl border border-slate-700 bg-slate-950 pr-4 pl-10 text-sm text-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-amber-500 text-sm font-black text-slate-950 hover:bg-amber-400 disabled:opacity-60"
                  >
                    {isLoading ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        <span>Đang gửi email...</span>
                      </>
                    ) : (
                      <>
                        <span>Gửi Link Khôi Phục</span>
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </button>
                </form>
              ) : (
                <div className="space-y-4 rounded-2xl border border-emerald-700/50 bg-emerald-950/40 p-5">
                  <CheckCircle2 className="h-10 w-10 text-emerald-400" />
                  <div>
                    <h3 className="text-lg font-black text-white">
                      Kiểm tra hộp thư
                    </h3>
                    <p className="mt-1 text-xs text-slate-300">
                      Link đặt lại mật khẩu đã gửi tới{" "}
                      <strong className="text-amber-300">{forgotEmail}</strong>.
                      Mở email và làm theo hướng dẫn (trang{" "}
                      <code className="text-emerald-300">/dat-lai-mat-khau</code>
                      ).
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setMode("login");
                      setForgotStep(1);
                      setLoginEmail(forgotEmail);
                    }}
                    className="h-11 w-full cursor-pointer rounded-xl border border-slate-600 bg-slate-900 text-xs font-bold text-white hover:bg-slate-800"
                  >
                    Quay về đăng nhập
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
