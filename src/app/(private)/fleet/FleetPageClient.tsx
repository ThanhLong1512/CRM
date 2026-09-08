"use client";

import { useDeferredValue, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  CheckCircle2,
  Search,
  Truck,
} from "lucide-react";
import { CreateVehicleDialog } from "@/app/(private)/fleet/CreateVehicleDialog";
import { VehicleActionMenu } from "@/app/(private)/fleet/VehicleActionMenu";
import type { FleetVehicleDto } from "@/lib/data/fleet";
import {
  fleetLevelLabel,
  type FleetAlertLevel,
} from "@/lib/fleet-status";
import { PageHero, StatCard } from "@/components/features/PageHero";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type FleetCustomerOption = { id: string; name: string };

type FleetPageClientProps = {
  vehicles: FleetVehicleDto[];
  customers: FleetCustomerOption[];
};

type LevelFilter = "all" | FleetAlertLevel;
type UnitFilter = "all" | "KM" | "HOUR";

function levelBadgeVariant(
  level: FleetAlertLevel,
): "default" | "secondary" | "destructive" | "outline" {
  switch (level) {
    case "RED":
      return "destructive";
    case "YELLOW":
      return "secondary";
    default:
      return "outline";
  }
}

function unitSuffix(unit: "KM" | "HOUR"): string {
  return unit === "KM" ? "km" : "giờ";
}

export function FleetPageClient({
  vehicles,
  customers,
}: FleetPageClientProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const [level, setLevel] = useState<LevelFilter>("all");
  const [unit, setUnit] = useState<UnitFilter>("all");

  const filtered = useMemo(() => {
    const q = deferredQuery.trim().toLowerCase();
    return vehicles.filter((v) => {
      if (level !== "all" && v.level !== level) return false;
      if (unit !== "all" && v.unit !== unit) return false;
      if (!q) return true;
      const haystack = [v.plateNumber, v.label ?? "", v.customerName, v.notes ?? ""]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [vehicles, deferredQuery, level, unit]);

  const redCount = vehicles.filter((v) => v.level === "RED").length;
  const yellowCount = vehicles.filter((v) => v.level === "YELLOW").length;
  const greenCount = vehicles.filter((v) => v.level === "GREEN").length;
  const hasFilters =
    deferredQuery.trim().length > 0 || level !== "all" || unit !== "all";

  function refresh() {
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <PageHero
        icon={Truck}
        title="Đội xe & bảo dưỡng"
        description="Theo dõi đầu xe FLEET và cảnh báo thay nhớt (Đỏ / Vàng / Xanh)"
        actions={
          <CreateVehicleDialog customers={customers} onChanged={refresh} />
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Tổng đầu xe"
          value={vehicles.length}
          icon={Truck}
          tone="sky"
        />
        <StatCard
          label="Đèn đỏ"
          value={redCount}
          hint="≤ 10% chu kỳ"
          icon={AlertTriangle}
          tone="rose"
        />
        <StatCard
          label="Đèn vàng"
          value={yellowCount}
          hint="10–25% chu kỳ"
          icon={AlertTriangle}
          tone="amber"
        />
        <StatCard
          label="Đèn xanh"
          value={greenCount}
          hint="> 25% chu kỳ"
          icon={CheckCircle2}
          tone="emerald"
        />
      </div>

      <Card className="rounded-2xl border border-slate-200 bg-white shadow-xs">
        <CardHeader className="pb-3">
          <CardTitle className="font-display text-base font-semibold text-slate-900">
            Bộ lọc
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3 lg:flex-row">
            <div className="relative min-w-0 flex-1">
              <Search
                className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Tìm biển số, khách, nhãn..."
                className="h-10 pl-9"
              />
            </div>
            <Select
              value={level}
              onValueChange={(v) => {
                if (
                  v === "all" ||
                  v === "RED" ||
                  v === "YELLOW" ||
                  v === "GREEN"
                ) {
                  setLevel(v);
                }
              }}
            >
              <SelectTrigger className="h-10 w-full lg:w-48">
                <SelectValue placeholder="Tất cả đèn" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả đèn</SelectItem>
                <SelectItem value="RED">Đỏ</SelectItem>
                <SelectItem value="YELLOW">Vàng</SelectItem>
                <SelectItem value="GREEN">Xanh</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={unit}
              onValueChange={(v) => {
                if (v === "all" || v === "KM" || v === "HOUR") setUnit(v);
              }}
            >
              <SelectTrigger className="h-10 w-full lg:w-40">
                <SelectValue placeholder="Đơn vị" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả đơn vị</SelectItem>
                <SelectItem value="KM">Km</SelectItem>
                <SelectItem value="HOUR">Giờ máy</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <p className="text-sm text-slate-500">
        Hiển thị {filtered.length} / {vehicles.length} đầu xe.
      </p>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Biển số</TableHead>
              <TableHead>Khách hàng</TableHead>
              <TableHead>Meter</TableHead>
              <TableHead>Chu kỳ</TableHead>
              <TableHead>Còn lại</TableHead>
              <TableHead>Cảnh báo</TableHead>
              <TableHead className="w-12">
                <span className="sr-only">Hành động</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {customers.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="h-24 text-center text-muted-foreground"
                >
                  Chưa có khách FLEET. Tạo khách loại FLEET trước khi thêm xe.
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="h-24 text-center text-muted-foreground"
                >
                  {hasFilters
                    ? "Không tìm thấy đầu xe phù hợp."
                    : "Chưa có đầu xe. Bấm “Thêm đầu xe” để tạo."}
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((vehicle) => (
                <TableRow key={vehicle.id}>
                  <TableCell className="font-medium">
                    <div className="flex flex-col gap-0.5">
                      <span>{vehicle.plateNumber}</span>
                      {vehicle.label ? (
                        <span className="text-xs text-muted-foreground">
                          {vehicle.label}
                        </span>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell>{vehicle.customerName}</TableCell>
                  <TableCell className="tabular-nums">
                    {vehicle.currentMeter.toLocaleString("vi-VN")}{" "}
                    {unitSuffix(vehicle.unit)}
                  </TableCell>
                  <TableCell className="tabular-nums text-muted-foreground">
                    {vehicle.intervalValue.toLocaleString("vi-VN")}{" "}
                    {unitSuffix(vehicle.unit)}
                  </TableCell>
                  <TableCell className="tabular-nums">
                    {vehicle.remaining.toLocaleString("vi-VN")}{" "}
                    {unitSuffix(vehicle.unit)}
                    <span className="ml-1 text-xs text-muted-foreground">
                      ({Math.round(vehicle.percent)}%)
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={levelBadgeVariant(vehicle.level)}>
                      {fleetLevelLabel(vehicle.level)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <VehicleActionMenu
                      vehicle={vehicle}
                      customers={customers}
                      onChanged={refresh}
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
