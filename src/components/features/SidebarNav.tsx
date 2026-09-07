"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  filterNavGroups,
  isNavActive,
} from "@/components/features/nav-config";
import { cn } from "@/lib/utils";

type SidebarNavProps = {
  userRole: string;
  variant?: "desktop" | "mobile";
};

export function SidebarNav({
  userRole,
  variant = "desktop",
}: SidebarNavProps) {
  const pathname = usePathname();
  const groups = filterNavGroups(userRole);

  if (variant === "mobile") {
    return (
      <nav className="flex gap-1 overflow-x-auto px-3 py-2">
        {groups.flatMap((group) =>
          group.items.map((item) => {
            const Icon = item.icon;
            const active = isNavActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex shrink-0 items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs transition-colors",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <Icon className="size-3.5" aria-hidden />
                {item.label}
              </Link>
            );
          }),
        )}
      </nav>
    );
  }

  return (
    <nav className="flex flex-1 flex-col overflow-y-auto p-2">
      <Accordion
        multiple
        defaultValue={groups.map((group) => group.id)}
        className="gap-1"
      >
        {groups.map((group) => (
          <AccordionItem
            key={group.id}
            value={group.id}
            className="border-none"
          >
            <AccordionTrigger className="px-2 py-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase hover:no-underline hover:text-foreground">
              {group.label}
            </AccordionTrigger>
            <AccordionContent className="pb-1">
              <ul className="flex flex-col gap-0.5 pl-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const active = isNavActive(pathname, item.href);
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className={cn(
                          "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors",
                          active
                            ? "bg-primary text-primary-foreground shadow-sm"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground",
                        )}
                      >
                        <Icon className="size-4 shrink-0" aria-hidden />
                        <span className="truncate">{item.label}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </nav>
  );
}
