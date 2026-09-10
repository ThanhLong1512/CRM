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
  Palette,
  Globe,
} from "lucide-react";
import type { AuthUserProfile } from "@/components/auth/authData";
import { soundFX } from "@/components/utils/audio";
import { ThemeSegmented } from "@/components/common/ThemeToggle";
import { LanguageSegmented } from "@/components/common/LanguageToggle";
import { useTranslation } from "@/components/providers/language-provider";
import type { TranslationKey } from "@/lib/i18n/translations";

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
  const { t } = useTranslation();

  if (!isOpen) return null;

  const initials = currentUser.name
    .split(" ")
    .map((n) => n[0])
    .slice(-2)
    .join("");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl transition-colors">
        {/* Modal Top Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 p-5 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 dark:bg-slate-800 border border-slate-700 font-mono text-sm font-bold text-amber-400 shadow-xs">
              {initials}
            </div>
            <div>
              <h3 className="text-base font-black leading-tight text-slate-900 dark:text-slate-100 sm:text-lg">
                {t("profileModalTitle")}
              </h3>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                {t("profileCode")}{" "}
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                  {currentUser.id.slice(0, 12)}
                </span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-5">
          {/* User Hero Badge Card */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 p-4 text-white shadow-md border border-slate-800">
            <div className="flex items-start justify-between">
              <div>
                <span
                  className={`mb-2 inline-block rounded-full px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase shadow-2xs ${
                    currentUser.role === "director"
                      ? "bg-amber-500 text-slate-950"
                      : currentUser.role === "accountant"
                        ? "bg-sky-400 text-slate-950"
                        : "bg-emerald-400 text-slate-950"
                  }`}
                >
                  {currentUser.role === "director"
                    ? t("roleDirector").toUpperCase()
                    : currentUser.role === "accountant"
                      ? t("roleAccountant").toUpperCase()
                      : t("roleSales").toUpperCase()}
                </span>
                <h4 className="text-lg font-black text-white">
                  {currentUser.name}
                </h4>
                <p className="mt-0.5 text-xs font-medium text-amber-400">
                  {currentUser.roleTitle}
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-white/10 shadow-inner">
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
                <span className="font-mono">{currentUser.phone || "—"}</span>
              </div>
            </div>
          </div>

          {/* Department & Hub Info Card */}
          <div className="space-y-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 p-3.5 text-xs">
            <div className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-1.5 font-medium text-slate-500 dark:text-slate-400">
                <Building className="h-3.5 w-3.5 text-slate-600 dark:text-slate-400" />
                {t("profileDepartment")}
              </span>
              <span className="text-right font-bold text-slate-900 dark:text-slate-100">
                {currentUser.department}
              </span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-1.5 font-medium text-slate-500 dark:text-slate-400">
                <ShieldCheck className="h-3.5 w-3.5 text-slate-600 dark:text-slate-400" />
                {t("profileWarehouse")}
              </span>
              <span className="text-right font-bold text-slate-900 dark:text-slate-100">
                {currentUser.assignedWarehouse}
              </span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-1.5 font-medium text-slate-500 dark:text-slate-400">
                <Clock className="h-3.5 w-3.5 text-slate-600 dark:text-slate-400" />
                {t("profileLoginTime")}
              </span>
              <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">
                {currentUser.lastLogin || t("profileCurrentSession")}
              </span>
            </div>
          </div>

          {/* NEW: Personal Preferences (Dark Mode + Multi-Language) */}
          <div className="space-y-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 p-3.5 text-xs">
            <div className="flex items-center justify-between font-bold text-slate-800 dark:text-slate-200">
              <div className="flex items-center gap-1.5">
                <Palette className="h-4 w-4 text-amber-500" />
                <span>{t("profilePreferences")}</span>
              </div>
            </div>

            {/* Row 1: Theme Switcher (Sáng / Tối / Tự động) */}
            <div className="flex items-center justify-between gap-2 pt-1">
              <span className="font-medium text-slate-600 dark:text-slate-400">
                {t("themeTitle")}
              </span>
              <ThemeSegmented
                size="sm"
                className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700/60"
              />
            </div>

            {/* Row 2: Language Switcher (VI / EN / ZH / JA) */}
            <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
              <div className="flex items-center gap-1.5 font-medium text-slate-600 dark:text-slate-400">
                <Globe className="h-3.5 w-3.5 text-slate-400" />
                <span>{t("languageTitle")}</span>
              </div>
              <LanguageSegmented
                size="sm"
                className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700/60"
              />
            </div>
          </div>

          {/* Operational Permissions Badges */}
          <div className="space-y-2">
            <h5 className="text-xs font-bold tracking-wider text-slate-600 dark:text-slate-400 uppercase">
              {t("profilePermissions")}
            </h5>
            <div className="grid grid-cols-2 gap-2">
              {(
                [
                  ["canApproveCredit", "permApproveCredit"],
                  ["canViewCostPrice", "permViewCostPrice"],
                  ["canCreateOrders", "permCreateOrders"],
                  ["canExportReports", "permExportReports"],
                ] as const
              ).map(([key, transKey]) => {
                const on = currentUser.permissions[key];
                return (
                  <div
                    key={key}
                    className={`flex items-center gap-2 rounded-xl border p-2 text-xs transition-colors ${
                      on
                        ? "border-emerald-200 dark:border-emerald-900/60 bg-emerald-50 dark:bg-emerald-950/40 font-semibold text-emerald-900 dark:text-emerald-300"
                        : "border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800/40 text-slate-400 line-through"
                    }`}
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                    <span>{t(transKey as TranslationKey)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Modal Bottom Actions */}
        <div className="flex items-center justify-between gap-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 p-4">
          <button
            type="button"
            onClick={() => {
              soundFX.playClick();
              onOpenChangePassword();
            }}
            className="flex h-11 cursor-pointer items-center gap-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 text-xs font-bold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            <KeyRound className="h-4 w-4 text-slate-600 dark:text-slate-400" />
            <span>{t("profileChangePassword")}</span>
          </button>
          <button
            type="button"
            onClick={() => {
              soundFX.playClick();
              onRequestLogout();
            }}
            className="flex h-11 cursor-pointer items-center gap-2 rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-950/40 px-5 text-xs font-extrabold text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/60 transition-colors"
          >
            <LogOut className="h-4 w-4 text-rose-600 dark:text-rose-400" />
            <span>{t("profileLogout")}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
