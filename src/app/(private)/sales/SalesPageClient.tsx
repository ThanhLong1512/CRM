"use client";

import dynamic from "next/dynamic";
import { useMemo, useState, useTransition } from "react";
import { MapPin, Navigation, RefreshCw, Route } from "lucide-react";
import { toast } from "sonner";
import { createCheckIn } from "@/app/(private)/sales/actions";
import type { CheckInDto } from "@/lib/data/check-ins";
import { CHECK_IN_MAX_DISTANCE_M, haversineMeters } from "@/lib/geo";
import type { CustomerDto } from "@/app/(private)/khach-hang/customer-query";
import { PageHero } from "@/components/features/PageHero";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const CustomerMap = dynamic(
  () =>
    import("@/components/features/CustomerMap").then((mod) => mod.CustomerMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-[360px] items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-sm text-slate-500">
        Đang tải bản đồ...
      </div>
    ),
  },
);

type SalesPageClientProps = {
  customers: CustomerDto[];
  todayCheckIns: CheckInDto[];
};

function readPosition(): Promise<{ lat: number; lng: number }> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Trình duyệt không hỗ trợ GPS."));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
      },
      (err) => {
        reject(
          new Error(
            err.message || "Không lấy được vị trí. Hãy cho phép quyền GPS.",
          ),
        );
      },
      { enableHighAccuracy: true, timeout: 15_000, maximumAge: 5_000 },
    );
  });
}

export function SalesPageClient({
  customers,
  todayCheckIns,
}: SalesPageClientProps) {
  const geoCustomers = useMemo(
    () =>
      customers.filter(
        (c): c is CustomerDto & { lat: number; lng: number } =>
          c.lat != null && c.lng != null,
      ),
    [customers],
  );

  const [selectedId, setSelectedId] = useState<string | null>(
    geoCustomers[0]?.id ?? null,
  );
  const [myPosition, setMyPosition] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [locating, setLocating] = useState(false);
  const [pending, startTransition] = useTransition();
  const [checkIns, setCheckIns] = useState(todayCheckIns);

  const selected = geoCustomers.find((c) => c.id === selectedId) ?? null;

  const distanceM =
    selected && myPosition
      ? haversineMeters(
          myPosition.lat,
          myPosition.lng,
          selected.lat,
          selected.lng,
        )
      : null;

  const canCheckIn =
    Boolean(selected) &&
    distanceM != null &&
    distanceM <= CHECK_IN_MAX_DISTANCE_M;

  async function refreshLocation() {
    setLocating(true);
    try {
      const pos = await readPosition();
      setMyPosition(pos);
      toast.success("Đã cập nhật vị trí GPS.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Không lấy được GPS.",
      );
    } finally {
      setLocating(false);
    }
  }

  function handleCheckIn() {
    if (!selected) {
      toast.error("Vui lòng chọn khách hàng.");
      return;
    }

    startTransition(async () => {
      try {
        const pos = myPosition ?? (await readPosition());
        setMyPosition(pos);

        const result = await createCheckIn({
          customerId: selected.id,
          lat: pos.lat,
          lng: pos.lng,
        });

        if (!result.success) {
          toast.error(result.error ?? result.message);
          return;
        }

        toast.success(result.message);
        setCheckIns((prev) => [
          {
            id: `local-${Date.now()}`,
            customerId: selected.id,
            customerName: selected.name,
            userName: "Bạn",
            userEmail: "",
            lat: pos.lat,
            lng: pos.lng,
            distanceM: result.distanceM ?? distanceM ?? 0,
            createdAt: new Date().toISOString(),
          },
          ...prev,
        ]);
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Check-in thất bại.",
        );
      }
    });
  }

  return (
    <div className="space-y-6">
      <PageHero
        icon={Route}
        title="Tuyến Sales & Check-in"
        description={`Bản đồ khách hàng có GPS — check-in trong bán kính ${CHECK_IN_MAX_DISTANCE_M}m`}
        actions={
          <Button
            type="button"
            variant="outline"
            className="gap-1.5"
            disabled={locating || pending}
            onClick={refreshLocation}
          >
            <RefreshCw
              className={`size-4 ${locating ? "animate-spin" : ""}`}
              aria-hidden
            />
            {locating ? "Đang lấy GPS..." : "Lấy vị trí của tôi"}
          </Button>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
        <Card className="rounded-2xl border border-slate-200 bg-white shadow-xs">
          <CardHeader className="pb-3">
            <CardTitle className="font-display text-base font-semibold text-slate-900">
              Khách hàng trên tuyến
            </CardTitle>
            <p className="text-sm text-slate-500">
              {geoCustomers.length} điểm có tọa độ
            </p>
          </CardHeader>
          <CardContent className="max-h-[420px] space-y-2 overflow-y-auto p-3 pt-0">
            {geoCustomers.length === 0 ? (
              <p className="px-1 py-6 text-center text-sm text-slate-500">
                Chưa có khách hàng nào gắn lat/lng. Cập nhật trong mục Khách
                hàng.
              </p>
            ) : (
              geoCustomers.map((customer) => {
                const active = customer.id === selectedId;
                return (
                  <button
                    key={customer.id}
                    type="button"
                    onClick={() => setSelectedId(customer.id)}
                    className={`w-full rounded-xl border px-3 py-2 text-left transition-colors ${
                      active
                        ? "border-amber-400 bg-amber-50"
                        : "border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-medium text-slate-900">
                        {customer.name}
                      </span>
                      <Badge
                        variant={
                          customer.type === "FLEET" ? "default" : "secondary"
                        }
                      >
                        {customer.type}
                      </Badge>
                    </div>
                    <p className="mt-1 line-clamp-2 text-xs text-slate-500">
                      {customer.address || "Chưa có địa chỉ"}
                    </p>
                  </button>
                );
              })
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
            <CustomerMap
              customers={geoCustomers.map((c) => ({
                id: c.id,
                name: c.name,
                type: c.type,
                address: c.address,
                lat: c.lat,
                lng: c.lng,
              }))}
              selectedId={selectedId}
              myPosition={myPosition}
              onSelect={setSelectedId}
              className="h-[420px] w-full"
            />
          </div>

          <Card className="rounded-2xl border border-slate-200 bg-white shadow-xs">
            <CardHeader className="pb-2">
              <CardTitle className="font-display text-base font-semibold text-slate-900">
                Check-in tại điểm
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1 text-sm">
                {selected ? (
                  <>
                    <p className="font-medium text-slate-900">{selected.name}</p>
                    <p className="text-slate-500">{selected.address || "—"}</p>
                    <p className="flex items-center gap-1.5 tabular-nums text-slate-500">
                      <MapPin className="size-3.5" aria-hidden />
                      {selected.lat.toFixed(5)}, {selected.lng.toFixed(5)}
                    </p>
                    {distanceM != null ? (
                      <p
                        className={
                          distanceM <= CHECK_IN_MAX_DISTANCE_M
                            ? "text-emerald-700"
                            : "text-rose-600"
                        }
                      >
                        Cách bạn: {Math.round(distanceM)}m
                        {distanceM > CHECK_IN_MAX_DISTANCE_M
                          ? ` (cần ≤ ${CHECK_IN_MAX_DISTANCE_M}m)`
                          : " — trong phạm vi"}
                      </p>
                    ) : (
                      <p className="text-slate-500">
                        Bấm “Lấy vị trí của tôi” để tính khoảng cách.
                      </p>
                    )}
                  </>
                ) : (
                  <p className="text-slate-500">
                    Chọn một khách hàng trên danh sách hoặc bản đồ.
                  </p>
                )}
              </div>
              <Button
                type="button"
                className="gap-1.5 self-start sm:self-auto"
                disabled={!selected || pending}
                onClick={handleCheckIn}
              >
                <Navigation className="size-4" aria-hidden />
                {pending
                  ? "Đang check-in..."
                  : canCheckIn
                    ? "Check-in"
                    : `Check-in (cần ≤${CHECK_IN_MAX_DISTANCE_M}m)`}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className="rounded-2xl border border-slate-200 bg-white shadow-xs">
        <CardHeader className="pb-3">
          <CardTitle className="font-display text-base font-semibold text-slate-900">
            Check-in hôm nay
          </CardTitle>
          <p className="text-sm text-slate-500">
            {checkIns.length} lượt ghi nhận
          </p>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Thời gian</TableHead>
                <TableHead>Khách hàng</TableHead>
                <TableHead>Nhân viên</TableHead>
                <TableHead className="text-right">Khoảng cách</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {checkIns.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="h-20 text-center text-slate-500"
                  >
                    Chưa có check-in nào hôm nay.
                  </TableCell>
                </TableRow>
              ) : (
                checkIns.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="tabular-nums text-slate-500">
                      {new Date(row.createdAt).toLocaleTimeString("vi-VN")}
                    </TableCell>
                    <TableCell className="font-medium text-slate-900">
                      {row.customerName}
                    </TableCell>
                    <TableCell className="text-slate-500">
                      {row.userName || row.userEmail || "—"}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {Math.round(row.distanceM)}m
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
