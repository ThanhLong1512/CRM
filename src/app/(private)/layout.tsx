import type { ReactNode } from "react";
import Link from "next/link";
import { OfflineBanner } from "@/components/features/OfflineBanner";

const navItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/sales", label: "Sales" },
  { href: "/fleet", label: "Fleet" },
] as const;

export default function PrivateLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-full flex-1 flex-col md:flex-row">
      <aside className="border-b border-border bg-muted/40 px-4 py-4 md:w-56 md:border-r md:border-b-0">
        <p className="mb-4 text-sm font-semibold tracking-tight">crm-dauan</p>
        <nav className="flex flex-row gap-3 md:flex-col">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <div className="flex flex-1 flex-col">
        <OfflineBanner />
        <div className="flex-1 p-6">{children}</div>
      </div>
    </div>
  );
}
