"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Sun, Moon, Laptop, Check } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { soundFX } from "@/components/utils/audio";

interface ThemeToggleProps {
  className?: string;
  align?: "start" | "center" | "end";
}

/**
 * Dropdown Theme Toggle Button for Header / Toolbars
 */
export function ThemeToggle({ className = "", align = "end" }: ThemeToggleProps) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div
        className={`size-8 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 animate-pulse ${className}`}
      />
    );
  }

  const isDark = resolvedTheme === "dark";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            type="button"
            aria-label="Thay đổi giao diện sáng/tối"
            title={`Giao diện hiện tại: ${
              theme === "system"
                ? "Tự động"
                : theme === "dark"
                  ? "Tối"
                  : "Sáng"
            }`}
            className={`relative flex size-8 cursor-pointer items-center justify-center rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 shadow-2xs transition-all hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-950 dark:hover:text-white ${className}`}
          >
            {isDark ? (
              <Moon className="size-4 text-indigo-400 transition-transform hover:-rotate-12" />
            ) : (
              <Sun className="size-4 text-amber-500 transition-transform hover:rotate-45" />
            )}
            <span className="sr-only">Chuyển đổi chủ đề</span>
          </button>
        }
      />
      <DropdownMenuContent
        align={align}
        className="min-w-[170px] rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-1.5 shadow-xl text-xs select-none animate-in fade-in-50 zoom-in-95"
      >
        <DropdownMenuItem
          onClick={() => {
            soundFX.playClick();
            setTheme("light");
          }}
          className={`flex items-center justify-between rounded-lg px-2.5 py-2 cursor-pointer transition-colors ${
            theme === "light"
              ? "bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-300 font-bold"
              : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          <div className="flex items-center gap-2">
            <Sun className="size-4 text-amber-500" />
            <span>Chế độ Sáng</span>
          </div>
          {theme === "light" && <Check className="size-3.5 text-amber-600 dark:text-amber-400" />}
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => {
            soundFX.playClick();
            setTheme("dark");
          }}
          className={`flex items-center justify-between rounded-lg px-2.5 py-2 cursor-pointer transition-colors ${
            theme === "dark"
              ? "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-300 font-bold"
              : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          <div className="flex items-center gap-2">
            <Moon className="size-4 text-indigo-400" />
            <span>Chế độ Tối</span>
          </div>
          {theme === "dark" && <Check className="size-3.5 text-indigo-500" />}
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => {
            soundFX.playClick();
            setTheme("system");
          }}
          className={`flex items-center justify-between rounded-lg px-2.5 py-2 cursor-pointer transition-colors ${
            theme === "system"
              ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold"
              : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          <div className="flex items-center gap-2">
            <Laptop className="size-4 text-slate-500" />
            <span>Hệ thống</span>
          </div>
          {theme === "system" && <Check className="size-3.5 text-slate-600 dark:text-slate-300" />}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

interface ThemeSegmentedProps {
  className?: string;
  size?: "sm" | "default";
}

/**
 * 3-way Segmented Theme Switcher for Sidebar / Settings Panel
 */
export function ThemeSegmented({ className = "", size = "default" }: ThemeSegmentedProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className={`h-8 rounded-xl bg-slate-800/60 animate-pulse ${className}`} />
    );
  }

  const options: { id: "light" | "dark" | "system"; label: string; icon: typeof Sun }[] = [
    { id: "light", label: "Sáng", icon: Sun },
    { id: "dark", label: "Tối", icon: Moon },
    { id: "system", label: "Tự động", icon: Laptop },
  ];

  const isSmall = size === "sm";

  return (
    <div
      role="group"
      aria-label="Chọn chủ đề giao diện"
      className={`inline-flex items-center rounded-xl bg-slate-800/80 p-1 border border-slate-700/60 text-slate-400 ${className}`}
    >
      {options.map((opt) => {
        const Icon = opt.icon;
        const isActive = theme === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => {
              soundFX.playClick();
              setTheme(opt.id);
            }}
            className={`flex items-center justify-center gap-1.5 rounded-lg font-medium transition-all cursor-pointer ${
              isSmall ? "px-2 py-1 text-[11px]" : "px-3 py-1.5 text-xs"
            } ${
              isActive
                ? "bg-amber-500 text-slate-950 font-bold shadow-xs"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-700/50"
            }`}
            title={`Chuyển sang ${opt.label}`}
          >
            <Icon className={isSmall ? "size-3.5" : "size-4"} />
            <span>{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}
