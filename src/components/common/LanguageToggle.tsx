"use client";

import { useState, useEffect } from "react";
import { Check, Globe, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTranslation } from "@/components/providers/language-provider";
import { type SupportedLanguage, SUPPORTED_LANGUAGES } from "@/lib/i18n/translations";
import { soundFX } from "@/components/utils/audio";

interface LanguageToggleProps {
  className?: string;
  align?: "start" | "center" | "end";
  compact?: boolean;
}

/**
 * Dropdown Language Switcher for Header and Toolbars
 */
export function LanguageToggle({
  className = "",
  align = "end",
  compact = false,
}: LanguageToggleProps) {
  const { language, setLanguage, t } = useTranslation();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div
        className={`h-8 w-12 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 animate-pulse ${className}`}
      />
    );
  }

  const currentOption =
    SUPPORTED_LANGUAGES.find((opt) => opt.code === language) || SUPPORTED_LANGUAGES[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            type="button"
            aria-label="Thay đổi ngôn ngữ / Change language"
            title={`${t("languageCurrent")} ${currentOption.label}`}
            className={`relative flex h-8 cursor-pointer items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-2 text-xs font-bold text-slate-700 dark:text-slate-300 shadow-2xs transition-all hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-950 dark:hover:text-white ${className}`}
          >
            <span className="text-sm leading-none">{currentOption.flag}</span>
            {!compact && (
              <span className="font-mono text-[11px] font-bold uppercase tracking-wider">
                {currentOption.code}
              </span>
            )}
            <ChevronDown className="size-3 text-slate-400 -mr-0.5" />
          </button>
        }
      />
      <DropdownMenuContent
        align={align}
        className="min-w-[170px] rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-1.5 shadow-xl text-xs select-none animate-in fade-in-50 zoom-in-95"
      >
        {SUPPORTED_LANGUAGES.map((opt) => {
          const isSelected = language === opt.code;
          return (
            <DropdownMenuItem
              key={opt.code}
              onClick={() => {
                soundFX.playClick();
                setLanguage(opt.code);
              }}
              className={`flex items-center justify-between rounded-lg px-2.5 py-2 cursor-pointer transition-colors ${
                isSelected
                  ? "bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-300 font-bold"
                  : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-base">{opt.flag}</span>
                <span className="truncate">{opt.nativeLabel}</span>
              </div>
              {isSelected && (
                <Check className="size-3.5 text-amber-600 dark:text-amber-400" />
              )}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

interface LanguageSegmentedProps {
  className?: string;
  size?: "sm" | "default";
}

/**
 * Segmented Language Switcher for Sidebar Footer & Settings
 */
export function LanguageSegmented({
  className = "",
  size = "default",
}: LanguageSegmentedProps) {
  const { language, setLanguage } = useTranslation();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className={`h-8 rounded-xl bg-slate-800/60 animate-pulse ${className}`} />
    );
  }

  const isSmall = size === "sm";

  return (
    <div
      role="group"
      aria-label="Chọn ngôn ngữ hiển thị"
      className={`inline-flex items-center rounded-xl bg-slate-800/80 p-1 border border-slate-700/60 text-slate-400 ${className}`}
    >
      {SUPPORTED_LANGUAGES.map((opt) => {
        const isSelected = language === opt.code;
        return (
          <button
            key={opt.code}
            type="button"
            onClick={() => {
              soundFX.playClick();
              setLanguage(opt.code);
            }}
            className={`flex items-center justify-center gap-1 rounded-lg font-medium transition-all cursor-pointer ${
              isSmall ? "px-1.5 py-1 text-[11px]" : "px-2.5 py-1.5 text-xs"
            } ${
              isSelected
                ? "bg-amber-500 text-slate-950 font-bold shadow-xs"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-700/50"
            }`}
            title={opt.label}
          >
            <span className={isSmall ? "text-xs" : "text-sm"}>{opt.flag}</span>
            <span className="font-mono text-[10px] uppercase font-bold">{opt.code}</span>
          </button>
        );
      })}
    </div>
  );
}
