'use client';

import { useState, useEffect, FormEvent } from 'react';
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
  Building,
  Check,
} from 'lucide-react';
import { AuthUser, UserRole } from '../../types';
import { DEMO_USERS } from './authData';
import { soundFX } from '../../utils/audio';

interface AuthScreenProps {
  onLoginSuccess: (user: AuthUser) => void;
  initialMode?: 'login' | 'register' | 'forgot';
}

type AuthMode = 'login' | 'register' | 'forgot';

export default function AuthScreen({
  onLoginSuccess,
  initialMode = 'login',
}: AuthScreenProps) {
  const [mode, setMode] = useState<AuthMode>(initialMode);

  // Login Form States
  const [loginEmail, setLoginEmail] = useState<string>('sales.anv@remixoil.vn');
  const [loginPassword, setLoginPassword] = useState<string>('123456');
  const [showLoginPassword, setShowLoginPassword] = useState<boolean>(false);
  const [rememberMe, setRememberMe] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');

  // Register Form States
  const [regName, setRegName] = useState<string>('');
  const [regEmail, setRegEmail] = useState<string>('');
  const [regPhone, setRegPhone] = useState<string>('');
  const [regRole, setRegRole] = useState<UserRole>('sales');
  const [regPassword, setRegPassword] = useState<string>('');
  const [regConfirmPassword, setRegConfirmPassword] = useState<string>('');
  const [showRegPassword, setShowRegPassword] = useState<boolean>(false);
  const [agreeTerms, setAgreeTerms] = useState<boolean>(true);

  // Forgot Password Wizard States
  const [forgotStep, setForgotStep] = useState<1 | 2 | 3>(1);
  const [forgotEmail, setForgotEmail] = useState<string>('sales.anv@remixoil.vn');
  const [otpCode, setOtpCode] = useState<string>('');
  const [otpCountdown, setOtpCountdown] = useState<number>(60);
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmNewPassword, setConfirmNewPassword] = useState<string>('');
  const [showNewPassword, setShowNewPassword] = useState<boolean>(false);

  // OTP Countdown timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (mode === 'forgot' && forgotStep === 2 && otpCountdown > 0) {
      timer = setInterval(() => {
        setOtpCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [mode, forgotStep, otpCountdown]);

  // Quick 1-Click Role Login
  const handleQuickLogin = (user: AuthUser) => {
    soundFX.playClick();
    setLoginEmail(user.email);
    setLoginPassword('123456');
    setErrorMessage('');
    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      soundFX.playSuccess();
      onLoginSuccess(user);
    }, 450);
  };

  // Submit Login
  const handleLoginSubmit = (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!loginEmail.trim()) {
      setErrorMessage('Vui lòng nhập Email hoặc Mã nhân viên');
      return;
    }
    if (!loginPassword) {
      setErrorMessage('Vui lòng nhập Mật khẩu');
      return;
    }

    setIsLoading(true);
    soundFX.playClick();

    setTimeout(() => {
      setIsLoading(false);
      // Check if matches a demo user or fallback to dynamic user
      const matchedUser = DEMO_USERS.find(
        (u) => u.email.toLowerCase() === loginEmail.trim().toLowerCase()
      );

      if (matchedUser) {
        soundFX.playSuccess();
        onLoginSuccess(matchedUser);
      } else {
        // Allow custom email login as Sales
        const dynamicUser: AuthUser = {
          id: `USR-${Date.now().toString().slice(-4)}`,
          name: loginEmail.split('@')[0].toUpperCase(),
          email: loginEmail.trim(),
          phone: '0909 000 111',
          role: 'sales',
          roleTitle: 'Chuyên Viên Sales Thị Trường',
          department: 'Khối Kinh Doanh Thực Địa',
          assignedWarehouse: 'Kho Tổng Bình Chánh (TP.HCM)',
          lastLogin: 'Vừa đăng nhập',
          permissions: {
            canApproveCredit: false,
            canViewCostPrice: false,
            canCreateOrders: true,
            canManageStaff: false,
            canExportReports: false,
          },
        };
        soundFX.playSuccess();
        onLoginSuccess(dynamicUser);
      }
    }, 550);
  };

  // Submit Register
  const handleRegisterSubmit = (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!regName.trim()) {
      setErrorMessage('Vui lòng nhập Họ và tên');
      return;
    }
    if (!regEmail.trim()) {
      setErrorMessage('Vui lòng nhập Email công việc');
      return;
    }
    if (!regPhone.trim()) {
      setErrorMessage('Vui lòng nhập Số điện thoại liên hệ');
      return;
    }
    if (regPassword.length < 6) {
      setErrorMessage('Mật khẩu phải có tối thiểu 6 ký tự');
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setErrorMessage('Mật khẩu xác nhận không khớp');
      return;
    }
    if (!agreeTerms) {
      setErrorMessage('Bạn cần đồng ý với Quy chế bảo mật dữ liệu phân phối');
      return;
    }

    setIsLoading(true);
    soundFX.playClick();

    setTimeout(() => {
      setIsLoading(false);
      const newUser: AuthUser = {
        id: `USR-${Date.now().toString().slice(-4)}`,
        name: regName.trim(),
        email: regEmail.trim(),
        phone: regPhone.trim(),
        role: regRole,
        roleTitle:
          regRole === 'director'
            ? 'Giám Đốc Kinh Doanh'
            : regRole === 'accountant'
            ? 'Kế Toán Quản Lý Công Nợ'
            : 'Chuyên Viên Sales Thị Trường',
        department:
          regRole === 'accountant'
            ? 'Phòng Tài Chính - Kế Toán'
            : regRole === 'director'
            ? 'Ban Điều Hành Phân Phối'
            : 'Khối Kinh Doanh Thực Địa',
        assignedWarehouse: 'Kho Tổng Bình Chánh (TP.HCM)',
        lastLogin: 'Tài khoản mới tạo',
        permissions: {
          canApproveCredit: regRole === 'director' || regRole === 'accountant',
          canViewCostPrice: regRole === 'director' || regRole === 'accountant',
          canCreateOrders: true,
          canManageStaff: regRole === 'director',
          canExportReports: regRole === 'director' || regRole === 'accountant',
        },
      };

      soundFX.playSuccess();
      setSuccessMessage('Đăng ký tài khoản thành công! Đang chuyển vào hệ thống...');
      setTimeout(() => {
        onLoginSuccess(newUser);
      }, 700);
    }, 600);
  };

  // Forgot Password Steps
  const handleSendOtp = (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    if (!forgotEmail.trim()) {
      setErrorMessage('Vui lòng nhập email tài khoản của bạn');
      return;
    }

    setIsLoading(true);
    soundFX.playClick();

    setTimeout(() => {
      setIsLoading(false);
      soundFX.playSuccess();
      setForgotStep(2);
      setOtpCountdown(60);
      setSuccessMessage(`Đã gửi mã OTP xác nhận đến ${forgotEmail}. Mã mẫu để thử nghiệm: 686868`);
    }, 500);
  };

  const handleVerifyOtp = (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    if (otpCode.trim().length !== 6) {
      setErrorMessage('Vui lòng nhập đủ mã OTP gồm 6 chữ số');
      return;
    }

    setIsLoading(true);
    soundFX.playClick();

    setTimeout(() => {
      setIsLoading(false);
      soundFX.playSuccess();
      setForgotStep(3);
      setSuccessMessage('Xác thực OTP thành công! Vui lòng nhập mật khẩu mới.');
    }, 450);
  };

  const handleResetPasswordSubmit = (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (newPassword.length < 6) {
      setErrorMessage('Mật khẩu mới phải có tối thiểu 6 ký tự');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setErrorMessage('Mật khẩu xác nhận không khớp');
      return;
    }

    setIsLoading(true);
    soundFX.playClick();

    setTimeout(() => {
      setIsLoading(false);
      soundFX.playSuccess();
      setSuccessMessage('Đổi mật khẩu thành công! Bạn có thể đăng nhập bằng mật khẩu mới.');
      setMode('login');
      setLoginEmail(forgotEmail);
      setLoginPassword(newPassword);
      setForgotStep(1);
      setOtpCode('');
    }, 600);
  };

  // Password Strength Calculation
  const getPasswordStrength = (pwd: string) => {
    if (!pwd) return { score: 0, label: '', color: 'bg-slate-200' };
    let score = 0;
    if (pwd.length >= 6) score += 1;
    if (pwd.length >= 8) score += 1;
    if (/[A-Z]/.test(pwd)) score += 1;
    if (/[0-9]/.test(pwd)) score += 1;
    if (/[^A-Za-z0-9]/.test(pwd)) score += 1;

    if (score <= 2) return { score, label: 'Yếu', color: 'bg-rose-500' };
    if (score <= 3) return { score, label: 'Trung bình', color: 'bg-amber-500' };
    return { score, label: 'Rất mạnh', color: 'bg-emerald-500' };
  };

  const regPwdStrength = getPasswordStrength(regPassword);
  const newPwdStrength = getPasswordStrength(newPassword);

  return (
    <div
      id="auth-root-container"
      className="min-h-screen w-full bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-3 sm:p-6 lg:p-10 relative overflow-hidden font-sans"
    >
      {/* Background Decorative Glow & Oil Mesh */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-sky-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Glass Shell Container */}
      <div className="w-full max-w-5xl rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl backdrop-blur-xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 z-10">
        {/* LEFT COLUMN: Industrial Brand Identity & Highlights (5 cols on lg) */}
        <div className="lg:col-span-5 p-6 sm:p-8 lg:p-10 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 border-b lg:border-b-0 lg:border-r border-slate-800 flex flex-col justify-between relative">
          <div>
            {/* Top Brand Logo */}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center shadow-lg shadow-amber-500/20 shrink-0">
                <Fuel className="w-7 h-7" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white font-display">
                  REMIX LUBRICANTS
                </h1>
                <p className="text-xs text-amber-400 font-mono font-bold tracking-wider uppercase">
                  CRM &amp; DMS Enterprise System
                </p>
              </div>
            </div>

            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed mb-6 font-medium">
              Giải pháp số hóa toàn diện kênh phân phối Dầu Nhớt &amp; Phụ Tùng B2B: Kiểm soát công nợ, quản lý luân chuyển vỏ phuy sắt 200L và điều phối Sales thực địa.
            </p>

            {/* Feature Badges List */}
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-800/60 border border-slate-700/60">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Credit Guard Bảo Vệ Hạn Mức</h4>
                  <p className="text-[11px] text-slate-400">
                    Khóa đơn tự động khi vượt hạn mức, duyệt khẩn cấp qua Giám Đốc.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-800/60 border border-slate-700/60">
                <div className="w-8 h-8 rounded-lg bg-sky-500/10 text-sky-400 flex items-center justify-center shrink-0 mt-0.5">
                  <RefreshCw className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Sổ Luân Chuyển Vỏ Phuy 200L</h4>
                  <p className="text-[11px] text-slate-400">
                    Khấu trừ cọc 300.000đ/vỏ, đối soát ký nhận số lượng vỏ trả tại tiệm.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-800/60 border border-slate-700/60">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Offline-First Thực Địa 100%</h4>
                  <p className="text-[11px] text-slate-400">
                    Lên đơn ngầm dưới hầm để xe, tự động đồng bộ khi có sóng 4G/Wifi.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Security Assurance */}
          <div className="mt-8 pt-6 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 font-mono">
            <span>Bảo mật 256-Bit SSL</span>
            <span className="text-amber-400 font-bold">Phiên bản v2.6 Pro</span>
          </div>
        </div>

        {/* RIGHT COLUMN: Interactive Form (7 cols on lg) */}
        <div className="lg:col-span-7 p-6 sm:p-8 lg:p-10 flex flex-col justify-center bg-slate-900/60">
          {/* Top Mode Header */}
          <div className="mb-6">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-mono font-bold uppercase tracking-widest text-amber-500">
                {mode === 'login'
                  ? 'Cổng Xác Thực Đăng Nhập'
                  : mode === 'register'
                  ? 'Đăng Ký Tài Khoản Mới'
                  : 'Khôi Phục & Quên Mật Khẩu'}
              </span>

              {mode !== 'login' && (
                <button
                  onClick={() => {
                    soundFX.playClick();
                    setMode('login');
                    setErrorMessage('');
                    setSuccessMessage('');
                  }}
                  className="text-xs text-slate-400 hover:text-white flex items-center gap-1 font-medium cursor-pointer transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Quay lại đăng nhập</span>
                </button>
              )}
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1">
              {mode === 'login' && 'Đăng nhập vào Hệ thống'}
              {mode === 'register' && 'Khởi tạo tài khoản công vụ'}
              {mode === 'forgot' && 'Khôi phục mật khẩu tài khoản'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              {mode === 'login' && 'Truy cập dữ liệu kho bãi, bảng giá đại lý và tuyến thị trường'}
              {mode === 'register' && 'Điền thông tin nhân sự để được phân quyền chức năng tương ứng'}
              {mode === 'forgot' && 'Nhập mã OTP bảo mật gửi về hòm thư để thiết lập mật khẩu mới'}
            </p>
          </div>

          {/* Alerts Banner */}
          {errorMessage && (
            <div className="mb-4 p-3 rounded-xl bg-rose-950/80 border border-rose-600 text-rose-200 text-xs font-semibold flex items-center gap-2 animate-shake">
              <span className="w-2 h-2 rounded-full bg-rose-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-950/80 border border-emerald-500 text-emerald-200 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* MODE 1: LOGIN */}
          {mode === 'login' && (
            <div className="space-y-5">
              {/* Quick 1-Click Role Login Bar */}
              <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>Đăng nhập nhanh với vai trò (1 chạm):</span>
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">Demo Ready</span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {DEMO_USERS.map((u) => {
                    const isSelected = loginEmail === u.email;
                    return (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => handleQuickLogin(u)}
                        className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-amber-500/20 border-amber-500 text-white shadow-xs'
                            : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800/80'
                        }`}
                      >
                        <div className="text-[10px] font-mono font-bold uppercase text-amber-400">
                          {u.role === 'sales'
                            ? 'Sales'
                            : u.role === 'accountant'
                            ? 'Kế Toán'
                            : 'GĐ Kinh Doanh'}
                        </div>
                        <div className="text-xs font-bold truncate mt-0.5">{u.name}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Standard Login Form */}
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Email Công Ty hoặc Tài Khoản
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      id="login-email-input"
                      type="text"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="vidu: sales.anv@remixoil.vn"
                      className="w-full h-12 pl-10 pr-4 rounded-xl bg-slate-950 border border-slate-700 text-sm font-medium text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-300">Mật khẩu</label>
                    <button
                      type="button"
                      onClick={() => {
                        soundFX.playClick();
                        setMode('forgot');
                        setErrorMessage('');
                        setSuccessMessage('');
                      }}
                      className="text-xs font-semibold text-amber-400 hover:text-amber-300 cursor-pointer transition-colors"
                    >
                      Quên mật khẩu?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      id="login-password-input"
                      type={showLoginPassword ? 'text' : 'password'}
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="Nhập mật khẩu..."
                      className="w-full h-12 pl-10 pr-11 rounded-xl bg-slate-950 border border-slate-700 text-sm font-medium text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 cursor-pointer p-1"
                    >
                      {showLoginPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Remember me option */}
                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-amber-500 focus:ring-amber-500 cursor-pointer"
                    />
                    <span className="text-xs text-slate-300 font-medium">
                      Ghi nhớ phiên đăng nhập trên máy này
                    </span>
                  </label>
                </div>

                {/* Primary Login Button */}
                <button
                  id="login-submit-btn"
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-13 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-[0.99] text-slate-950 font-black text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all cursor-pointer mt-2"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Đang xác thực bảo mật...</span>
                    </>
                  ) : (
                    <>
                      <span>Đăng Nhập Hệ Thống</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              {/* Switch to Register */}
              <div className="text-center pt-2">
                <span className="text-xs text-slate-400">Chưa có tài khoản nhân sự? </span>
                <button
                  type="button"
                  onClick={() => {
                    soundFX.playClick();
                    setMode('register');
                    setErrorMessage('');
                    setSuccessMessage('');
                  }}
                  className="text-xs font-bold text-amber-400 hover:underline cursor-pointer"
                >
                  Đăng ký tài khoản mới
                </button>
              </div>
            </div>
          )}

          {/* MODE 2: REGISTER */}
          {mode === 'register' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Họ và tên nhân sự <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      placeholder="Nguyễn Văn A"
                      className="w-full h-11 pl-10 pr-3 rounded-xl bg-slate-950 border border-slate-700 text-xs sm:text-sm font-medium text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Số điện thoại liên hệ <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      placeholder="0912 345 678"
                      className="w-full h-11 pl-10 pr-3 rounded-xl bg-slate-950 border border-slate-700 text-xs sm:text-sm font-medium text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Email công vụ / doanh nghiệp <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="sales.name@remixoil.vn"
                    className="w-full h-11 pl-10 pr-3 rounded-xl bg-slate-950 border border-slate-700 text-xs sm:text-sm font-medium text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Vị trí / Vai trò trong chuỗi cung ứng <span className="text-rose-400">*</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'sales', label: 'Sales Thực Địa', icon: User },
                    { id: 'accountant', label: 'Kế Toán Kho', icon: Building },
                    { id: 'director', label: 'Ban Quản Lý', icon: ShieldCheck },
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setRegRole(item.id as UserRole)}
                      className={`h-11 px-2 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        regRole === item.id
                          ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-xs'
                          : 'bg-slate-950 text-slate-300 border-slate-800 hover:bg-slate-800'
                      }`}
                    >
                      <item.icon className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Mật khẩu <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showRegPassword ? 'text' : 'password'}
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="Tối thiểu 6 ký tự"
                      className="w-full h-11 pl-10 pr-9 rounded-xl bg-slate-950 border border-slate-700 text-xs sm:text-sm font-medium text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegPassword(!showRegPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                    >
                      {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {regPassword && (
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden flex gap-1">
                        <div
                          className={`h-full ${regPwdStrength.color}`}
                          style={{ width: `${(regPwdStrength.score / 5) * 100}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-mono text-slate-400 font-bold">
                        {regPwdStrength.label}
                      </span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Xác nhận mật khẩu <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showRegPassword ? 'text' : 'password'}
                      value={regConfirmPassword}
                      onChange={(e) => setRegConfirmPassword(e.target.value)}
                      placeholder="Nhập lại mật khẩu"
                      className="w-full h-11 pl-10 pr-3 rounded-xl bg-slate-950 border border-slate-700 text-xs sm:text-sm font-medium text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-1">
                <label className="flex items-start gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={agreeTerms}
                    onChange={(e) => setAgreeTerms(e.target.checked)}
                    className="w-4 h-4 mt-0.5 rounded border-slate-700 bg-slate-950 text-amber-500 focus:ring-amber-500 cursor-pointer shrink-0"
                  />
                  <span className="text-xs text-slate-400 leading-snug">
                    Tôi cam kết bảo mật bảng giá sỉ dầu nhớt, danh sách hạn mức công nợ khách hàng và tuân thủ quy chế phân phối Remix Lubricants.
                  </span>
                </label>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-13 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-[0.99] text-slate-950 font-black text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Đang khởi tạo tài khoản...</span>
                  </>
                ) : (
                  <>
                    <span>Đăng Ký &amp; Đăng Nhập Ngay</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* MODE 3: FORGOT PASSWORD WIZARD */}
          {mode === 'forgot' && (
            <div className="space-y-4">
              {/* Stepper Progress */}
              <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
                {[
                  { step: 1, label: '1. Email' },
                  { step: 2, label: '2. Mã OTP' },
                  { step: 3, label: '3. Mật khẩu mới' },
                ].map((s) => (
                  <div
                    key={s.step}
                    className={`flex items-center gap-1.5 text-xs font-bold font-mono ${
                      forgotStep === s.step
                        ? 'text-amber-400'
                        : forgotStep > s.step
                        ? 'text-emerald-400'
                        : 'text-slate-600'
                    }`}
                  >
                    <span
                      className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                        forgotStep === s.step
                          ? 'bg-amber-500 text-slate-950'
                          : forgotStep > s.step
                          ? 'bg-emerald-500 text-slate-950'
                          : 'bg-slate-800 text-slate-500'
                      }`}
                    >
                      {forgotStep > s.step ? <Check className="w-3 h-3" /> : s.step}
                    </span>
                    <span>{s.label}</span>
                  </div>
                ))}
              </div>

              {/* Step 1: Send OTP to Email */}
              {forgotStep === 1 && (
                <form onSubmit={handleSendOtp} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">
                      Nhập địa chỉ Email đăng ký tài khoản
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        placeholder="sales.anv@remixoil.vn"
                        className="w-full h-12 pl-10 pr-4 rounded-xl bg-slate-950 border border-slate-700 text-sm font-medium text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full h-12 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-[0.99] text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-md cursor-pointer transition-all"
                  >
                    {isLoading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Đang gửi mã...</span>
                      </>
                    ) : (
                      <>
                        <span>Gửi Mã Xác Thực OTP</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* Step 2: Enter 6-digit OTP */}
              {forgotStep === 2 && (
                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-bold text-slate-300">
                        Nhập mã xác thực 6 số (OTP)
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setOtpCode('686868');
                          soundFX.playClick();
                        }}
                        className="text-[11px] font-mono text-amber-400 hover:underline cursor-pointer"
                      >
                        ⚡ Điền nhanh mã mẫu: 686868
                      </button>
                    </div>

                    <div className="relative">
                      <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        maxLength={6}
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                        placeholder="686868"
                        className="w-full h-12 pl-10 pr-4 rounded-xl bg-slate-950 border border-slate-700 text-center text-lg font-mono font-black tracking-widest text-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>
                      {otpCountdown > 0 ? (
                        <>Mã hết hạn sau: <strong className="font-mono text-amber-400">{otpCountdown}s</strong></>
                      ) : (
                        <span className="text-rose-400 font-bold">Mã đã hết hạn</span>
                      )}
                    </span>

                    <button
                      type="button"
                      disabled={otpCountdown > 0}
                      onClick={() => {
                        setOtpCountdown(60);
                        soundFX.playClick();
                        setSuccessMessage('Đã gửi lại mã OTP mới!');
                      }}
                      className={`font-semibold ${
                        otpCountdown > 0
                          ? 'text-slate-600 cursor-not-allowed'
                          : 'text-amber-400 hover:underline cursor-pointer'
                      }`}
                    >
                      Gửi lại mã OTP
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading || otpCode.length !== 6}
                    className="w-full h-12 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-[0.99] disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-md cursor-pointer transition-all"
                  >
                    <span>Xác Nhận Mã OTP</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              )}

              {/* Step 3: Enter New Password */}
              {forgotStep === 3 && (
                <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Mật khẩu mới
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Nhập mật khẩu mới..."
                        className="w-full h-11 pl-10 pr-9 rounded-xl bg-slate-950 border border-slate-700 text-sm font-medium text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                      >
                        {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {newPassword && (
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden flex gap-1">
                          <div
                            className={`h-full ${newPwdStrength.color}`}
                            style={{ width: `${(newPwdStrength.score / 5) * 100}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-mono text-slate-400 font-bold">
                          {newPwdStrength.label}
                        </span>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Xác nhận mật khẩu mới
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        value={confirmNewPassword}
                        onChange={(e) => setConfirmNewPassword(e.target.value)}
                        placeholder="Nhập lại mật khẩu mới..."
                        className="w-full h-11 pl-10 pr-3 rounded-xl bg-slate-950 border border-slate-700 text-sm font-medium text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full h-12 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-[0.99] text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-md cursor-pointer transition-all"
                  >
                    <span>Lưu Mật Khẩu &amp; Quay Về Đăng Nhập</span>
                    <CheckCircle2 className="w-4 h-4" />
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
