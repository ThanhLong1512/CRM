"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  filterNavGroups,
  isNavActive,
} from "@/components/features/nav-config";
import { cn } from "@/lib/utils";

type SidebarNavProps = {
  userRole: string;
  variant?: "desktop" | "mobile";
  onNavigate?: () => void;
};

export function SidebarNav({
  userRole,
  variant = "desktop",
  onNavigate,
}: SidebarNavProps) {
  const pathname = usePathname();
  const groups = filterNavGroups(userRole);

  if (variant === "mobile" && !onNavigate) {
    // Legacy horizontal strip unused when shell uses drawer
    return null;
  }

  return (
    <nav className="flex flex-1 flex-col space-y-4 overflow-y-auto p-3">
      {groups.map((group) => (
        <div key={group.id} className="space-y-1">
          <div className="px-3 text-[10px] font-bold tracking-wider text-slate-500 uppercase">
            {group.label}
          </div>
          <ul className="space-y-0.5">
            {group.items.map((item) => {
              const Icon = item.icon;
              const active = isNavActive(pathname, item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    className={cn(
                      "group flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium transition-all",
                      active
                        ? "bg-amber-500 font-bold text-slate-950 shadow-sm"
                        : "text-slate-300 hover:bg-slate-800/80 hover:text-white",
                    )}
                  >
                    <Icon
                      className={cn(
                        "size-4 shrink-0 transition-colors",
                        active
                          ? "text-slate-950"
                          : "text-slate-400 group-hover:text-amber-400",
                      )}
                      aria-hidden
                    />
                    <span className="truncate">{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
