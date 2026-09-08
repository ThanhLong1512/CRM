import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

type PageHeroProps = {
  title: string;
  description?: ReactNode;
  icon: LucideIcon;
  actions?: ReactNode;
};

export function PageHero({
  title,
  description,
  icon: Icon,
  actions,
}: PageHeroProps) {
  return (
    <div className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs sm:flex-row sm:items-center">
      <div className="flex items-center gap-2.5">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-amber-600">
          <Icon className="size-5" aria-hidden />
        </div>
        <div>
          <h2 className="font-display text-xl font-extrabold tracking-tight text-slate-900 sm:text-2xl">
            {title}
          </h2>
          {description ? (
            <p className="mt-0.5 text-xs text-slate-500">{description}</p>
          ) : null}
        </div>
      </div>
      {actions ? (
        <div className="flex flex-wrap items-center gap-2">{actions}</div>
      ) : null}
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "amber",
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  icon: LucideIcon;
  tone?: "amber" | "emerald" | "sky" | "violet" | "rose" | "orange";
}) {
  const tones: Record<string, string> = {
    amber: "bg-amber-50 text-amber-600",
    emerald: "bg-emerald-50 text-emerald-600",
    sky: "bg-sky-50 text-sky-600",
    violet: "bg-violet-50 text-violet-600",
    rose: "bg-rose-50 text-rose-600",
    orange: "bg-orange-50 text-orange-600",
  };
  const valueTone: Record<string, string> = {
    amber: "text-amber-700",
    emerald: "text-emerald-700",
    sky: "text-sky-700",
    violet: "text-violet-700",
    rose: "text-rose-700",
    orange: "text-orange-700",
  };

  return (
    <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold tracking-wider text-slate-500 uppercase">
          {label}
        </span>
        <div
          className={`flex size-8 items-center justify-center rounded-lg ${tones[tone]}`}
        >
          <Icon className="size-4" aria-hidden />
        </div>
      </div>
      <div className="mt-3">
        <div className={`font-mono text-2xl font-black ${valueTone[tone]}`}>
          {value}
        </div>
        {hint ? (
          <p className="mt-1 text-[11px] font-semibold text-slate-500">{hint}</p>
        ) : null}
      </div>
    </div>
  );
}
