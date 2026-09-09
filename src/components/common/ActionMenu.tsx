"use client";

import * as React from "react";
import { MoreHorizontal, ChevronDown, type LucideIcon } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { soundFX } from "@/components/utils/audio";

export type ActionMenuItem = {
  id?: string;
  label: string;
  icon?: LucideIcon | React.ComponentType<{ className?: string }>;
  onClick: () => void;
  variant?: "default" | "destructive" | "warning";
  disabled?: boolean;
  hidden?: boolean;
  badge?: string;
  danger?: boolean;
};

export interface ActionMenuProps {
  items: (ActionMenuItem | "separator")[];
  trigger?: React.ReactNode;
  align?: "start" | "center" | "end";
  size?: "sm" | "default" | "lg";
  variant?: "ghost" | "outline" | "secondary";
  className?: string;
  menuClassName?: string;
  label?: string;
  title?: string;
  showChevron?: boolean;
}

/**
 * Universal Action Menu
 * - If `label` is provided: renders a pill button `[••• Thao tác ▾]` with dynamic width and no text wrapping.
 * - If `label` is omitted: renders a crisp square icon button `[•••]`.
 * - Isolates pointer events (`stopPropagation`) so it never triggers parent drag/click handlers.
 */
export function ActionMenu({
  items,
  trigger,
  align = "end",
  size = "default",
  variant = "outline",
  className = "",
  menuClassName = "min-w-[210px]",
  label,
  title = "Thao tác",
  showChevron = true,
}: ActionMenuProps) {
  const visibleItems = items.filter(
    (item) => item === "separator" || !item.hidden,
  );

  // Filter consecutive or boundary separators
  const sanitizedItems: (ActionMenuItem | "separator")[] = [];
  for (let i = 0; i < visibleItems.length; i++) {
    const item = visibleItems[i];
    if (item === "separator") {
      if (
        sanitizedItems.length > 0 &&
        sanitizedItems[sanitizedItems.length - 1] !== "separator" &&
        i < visibleItems.length - 1
      ) {
        sanitizedItems.push("separator");
      }
    } else {
      sanitizedItems.push(item);
    }
  }

  if (sanitizedItems.length === 0) return null;

  // Responsive dimensions: auto width with padding when label is present, fixed square when icon-only
  const sizeClasses = label
    ? size === "sm"
      ? "h-7 px-2.5 gap-1.5 text-xs rounded-lg"
      : size === "lg"
        ? "h-9.5 px-3.5 gap-2 text-xs font-bold rounded-xl"
        : "h-8 px-3 gap-1.5 text-xs font-semibold rounded-xl"
    : size === "sm"
      ? "size-7 p-0 rounded-lg shrink-0"
      : size === "lg"
        ? "size-9 p-0 rounded-xl shrink-0"
        : "size-8 p-0 rounded-xl shrink-0";

  const variantClasses =
    variant === "outline"
      ? "border border-slate-200/90 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-950 hover:border-slate-300 shadow-2xs"
      : variant === "secondary"
        ? "border border-slate-200/70 bg-slate-100/90 text-slate-700 hover:bg-slate-200 hover:text-slate-950 shadow-2xs"
        : "text-slate-500 hover:bg-slate-100 hover:text-slate-950";

  return (
    <div
      className="inline-flex shrink-0 items-center"
      data-no-dnd="true"
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            trigger ? (
              (trigger as React.ReactElement)
            ) : (
              <button
                type="button"
                title={title}
                className={`inline-flex shrink-0 items-center justify-center whitespace-nowrap font-medium transition-all active:scale-95 cursor-pointer select-none ${variantClasses} ${sizeClasses} ${className}`}
              >
                <MoreHorizontal className="size-4 shrink-0 text-slate-500" />
                {label && (
                  <>
                    <span className="font-semibold text-slate-700">{label}</span>
                    {showChevron && (
                      <ChevronDown className="size-3 shrink-0 text-slate-400 -mr-0.5" />
                    )}
                  </>
                )}
              </button>
            )
          }
        />

        <DropdownMenuContent
          align={align}
          sideOffset={6}
          className={`z-50 rounded-2xl border border-slate-200/90 bg-white p-1.5 shadow-2xl backdrop-blur-md ring-1 ring-black/5 ${menuClassName}`}
        >
          {sanitizedItems.map((item, index) => {
            if (item === "separator") {
              return (
                <DropdownMenuSeparator
                  key={`sep-${index}`}
                  className="my-1 border-t border-slate-100"
                />
              );
            }

            const Icon = item.icon;
            const isDestructive = item.variant === "destructive" || item.danger;

            return (
              <DropdownMenuItem
                key={item.id ?? `item-${index}`}
                disabled={item.disabled}
                onClick={(e) => {
                  e.stopPropagation();
                  soundFX.playClick();
                  item.onClick();
                }}
                className={`flex w-full cursor-pointer items-center justify-between rounded-xl px-2.5 py-1.5 text-xs font-semibold transition-colors outline-hidden select-none ${
                  isDestructive
                    ? "text-rose-600 hover:bg-rose-50 hover:text-rose-700 focus:bg-rose-50 focus:text-rose-700"
                    : "text-slate-700 hover:bg-slate-100 hover:text-slate-950 focus:bg-slate-100 focus:text-slate-950"
                } ${item.disabled ? "opacity-40 pointer-events-none" : ""}`}
              >
                <div className="flex items-center gap-2.5">
                  {Icon && (
                    <div
                      className={`flex size-6 shrink-0 items-center justify-center rounded-lg ${
                        isDestructive
                          ? "bg-rose-50 text-rose-600"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      <Icon className="size-3.5" />
                    </div>
                  )}
                  <span className="leading-none">{item.label}</span>
                </div>

                {item.badge && (
                  <span className="ml-2 rounded-md bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] font-bold text-slate-600">
                    {item.badge}
                  </span>
                )}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

/**
 * Page Toolbar Dropdown Menu ("Thao tác ▾")
 * Designed for page headers to bundle secondary actions beside the primary CTA.
 */
export function PageActionMenu({
  items,
  label = "Thao tác",
  align = "end",
  className = "",
}: {
  items: (ActionMenuItem | "separator")[];
  label?: string;
  align?: "start" | "center" | "end";
  className?: string;
}) {
  return (
    <ActionMenu
      items={items}
      align={align}
      variant="outline"
      label={label}
      showChevron
      className={`border-slate-300 bg-white font-bold text-slate-800 shadow-2xs hover:bg-slate-50 ${className}`}
    />
  );
}

export default ActionMenu;
