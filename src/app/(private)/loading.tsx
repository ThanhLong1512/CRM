import AppLogo from "@/components/common/AppLogo";

export default function PrivateLoading() {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-50">
      {/* Sidebar Skeleton (Desktop) */}
      <aside className="hidden lg:flex w-64 flex-col border-r border-slate-800/80 bg-[#0F172A] p-4">
        <div className="border-b border-slate-800/80 pb-4">
          <AppLogo variant="sidebar" />
        </div>
        <div className="mt-4 space-y-3">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="h-9 w-full rounded-lg bg-slate-800/50 animate-pulse"
            />
          ))}
        </div>
      </aside>

      {/* Main Content Skeleton */}
      <div className="flex flex-1 flex-col overflow-y-auto">
        {/* Top Header Skeleton */}
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <AppLogo variant="header" />
            <div className="h-4 w-28 rounded-md bg-slate-200 animate-pulse hidden sm:block" />
          </div>
          <div className="flex items-center gap-2">
            <div className="h-7 w-20 rounded-lg bg-slate-100 animate-pulse" />
            <div className="h-8 w-8 rounded-full bg-slate-200 animate-pulse" />
          </div>
        </header>

        {/* Dashboard View Skeleton */}
        <main className="flex-1 p-4 sm:p-6 space-y-6">
          {/* Section 1: Executive Banner Skeleton */}
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-xl bg-amber-500/20 border border-amber-500/20 animate-pulse" />
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="h-6 w-64 rounded-md bg-slate-200 animate-pulse" />
                  <div className="h-5 w-16 rounded-full bg-slate-900/10 animate-pulse" />
                </div>
                <div className="h-3 w-80 max-w-full rounded-md bg-slate-100 animate-pulse" />
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-36 rounded-xl bg-emerald-100/70 animate-pulse" />
              <div className="h-9 w-32 rounded-xl bg-amber-200 animate-pulse" />
              <div className="h-9 w-36 rounded-xl bg-slate-200 animate-pulse" />
            </div>
          </div>

          {/* Section 2: 4 Top KPI Cards Skeleton */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-xs h-32"
              >
                <div className="flex items-center justify-between">
                  <div className="h-3.5 w-28 rounded bg-slate-200 animate-pulse" />
                  <div className="h-8 w-8 rounded-lg bg-slate-100 animate-pulse" />
                </div>
                <div className="space-y-2">
                  <div className="h-7 w-36 rounded-md bg-slate-200 animate-pulse" />
                  <div className="h-3 w-24 rounded bg-slate-100 animate-pulse" />
                </div>
              </div>
            ))}
          </div>

          {/* Section 3: Charts / Analytics Skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs h-80 flex flex-col justify-between">
              <div className="h-4 w-48 rounded bg-slate-200 animate-pulse" />
              <div className="h-56 w-full rounded-xl bg-slate-50 animate-pulse" />
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs h-80 flex flex-col justify-between">
              <div className="h-4 w-36 rounded bg-slate-200 animate-pulse" />
              <div className="h-56 w-full rounded-xl bg-slate-50 animate-pulse" />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
