import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

type MasterListSkeletonProps = {
  statCount?: number;
  rows?: number;
  columns?: number;
};

export function MasterListSkeleton({
  statCount = 3,
  rows = 6,
  columns = 6,
}: MasterListSkeletonProps) {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Đang tải">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-72 max-w-full" />
        </div>
        <Skeleton className="h-10 w-36" />
      </div>

      <div
        className={`grid gap-4 sm:grid-cols-2 ${
          statCount >= 4 ? "xl:grid-cols-4" : "sm:grid-cols-3"
        }`}
      >
        {Array.from({ length: statCount }).map((_, i) => (
          <Card
            key={i}
            className="bg-background shadow-none ring-1 ring-border/60"
          >
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-28" />
            </CardHeader>
            <CardContent className="space-y-2">
              <Skeleton className="h-9 w-16" />
              <Skeleton className="h-3 w-36" />
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-background shadow-none ring-1 ring-border/60">
        <CardHeader className="pb-3 space-y-2">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-4 w-64 max-w-full" />
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3 lg:flex-row">
            <Skeleton className="h-10 flex-1" />
            <Skeleton className="h-10 w-full lg:w-48" />
            <Skeleton className="h-10 w-full lg:w-48" />
          </div>
        </CardContent>
      </Card>

      <Skeleton className="h-4 w-56" />

      <div className="rounded-lg border border-border bg-background p-4 space-y-3">
        <div className="flex gap-3">
          {Array.from({ length: Math.min(columns, 5) }).map((_, i) => (
            <Skeleton key={i} className="h-4 flex-1" />
          ))}
        </div>
        {Array.from({ length: rows }).map((_, row) => (
          <div key={row} className="flex gap-3">
            {Array.from({ length: Math.min(columns, 5) }).map((_, col) => (
              <Skeleton key={col} className="h-8 flex-1" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
