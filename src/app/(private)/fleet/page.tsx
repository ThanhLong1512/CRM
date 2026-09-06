"use client";

import dynamic from "next/dynamic";

const LeafletMap = dynamic(
  () =>
    import("@/components/features/LeafletMap").then((mod) => mod.LeafletMap),
  { ssr: false },
);

export default function FleetPage() {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Fleet</h1>
        <p className="text-muted-foreground">
          Delivery routes and vehicle tracking placeholder.
        </p>
      </div>
      <LeafletMap />
    </div>
  );
}
