"use client";

import { Fuel } from "lucide-react";
import Link from "next/link";

export type AppLogoVariant = "login" | "sidebar" | "header" | "compact";

interface AppLogoProps {
  variant?: AppLogoVariant;
  href?: string;
  className?: string;
}

export default function AppLogo({
  variant = "header",
  href,
  className = "",
}: AppLogoProps) {
  const content = (
    <>
      {variant === "login" && (
        <div className={`flex items-center gap-3 ${className}`}>
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/25 transition-transform hover:scale-105">
            <Fuel className="h-7 w-7" />
          </div>
          <div className="text-left">
            <h1 className="text-xl font-black tracking-tight text-white sm:text-2xl">
              REMIX LUBRICANTS
            </h1>
            <p className="font-mono text-xs font-bold tracking-wider text-amber-400 uppercase">
              CRM &amp; DMS Enterprise System
            </p>
          </div>
        </div>
      )}

      {variant === "sidebar" && (
        <div className={`flex items-center gap-2.5 ${className}`}>
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 via-amber-500 to-orange-500 text-slate-950 shadow-md shadow-amber-500/20">
            <Fuel className="h-5 w-5 fill-slate-950/20 stroke-[2.2]" />
          </div>
          <div className="min-w-0 text-left">
            <div className="font-mono text-[10px] font-extrabold tracking-wider text-amber-400 uppercase">
              REMIX LUBRICANTS
            </div>
            <div className="truncate text-xs font-bold text-white tracking-tight leading-tight">
              CRM &amp; DMS Dầu Nhớt B2B
            </div>
          </div>
        </div>
      )}

      {variant === "header" && (
        <div className={`flex items-center gap-2 ${className}`}>
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-500 text-slate-950 shadow-xs shadow-amber-500/25">
            <Fuel className="h-4.5 w-4.5 stroke-[2.3]" />
          </div>
          <div className="hidden sm:flex flex-col text-left">
            <span className="font-mono text-[9px] font-extrabold tracking-wider text-amber-600 uppercase leading-none">
              REMIX LUBRICANTS
            </span>
            <span className="text-xs font-black tracking-tight text-slate-900 leading-tight">
              CRM / DMS B2B
            </span>
          </div>
        </div>
      )}

      {variant === "compact" && (
        <div
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-slate-950 shadow-xs shadow-amber-500/25 ${className}`}
          title="REMIX LUBRICANTS CRM & DMS"
        >
          <Fuel className="h-4.5 w-4.5 stroke-[2.3]" />
        </div>
      )}
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="inline-flex items-center transition-opacity hover:opacity-90 cursor-pointer"
      >
        {content}
      </Link>
    );
  }

  return <div className="inline-flex items-center">{content}</div>;
}
