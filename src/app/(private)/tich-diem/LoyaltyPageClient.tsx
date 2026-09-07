"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Gift, QrCode, UserRound } from "lucide-react";
import { toast } from "sonner";
import {
  findOrCreateMechanic,
  redeemReward,
  scanLoyaltyCode,
} from "@/app/(private)/tich-diem/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const QRScanner = dynamic(
  () =>
    import("@/components/features/QRScanner").then((mod) => mod.QRScanner),
  {
    ssr: false,
    loading: () => (
      <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
        Đang tải camera...
      </div>
    ),
  },
);

export type LoyaltyMechanicDto = {
  id: string;
  name: string;
  phone: string;
  points: number;
};

export type LoyaltyRewardDto = {
  id: string;
  name: string;
  pointsCost: number;
  stock: number;
};

export type LoyaltyLedgerDto = {
  id: string;
  delta: number;
  reason: string;
  note: string | null;
  createdAt: string;
};

type LoyaltyPageClientProps = {
  initialMechanic: LoyaltyMechanicDto | null;
  rewards: LoyaltyRewardDto[];
  ledger: LoyaltyLedgerDto[];
};

export function LoyaltyPageClient({
  initialMechanic,
  rewards: initialRewards,
  ledger: initialLedger,
}: LoyaltyPageClientProps) {
  const router = useRouter();
  const [name, setName] = useState(initialMechanic?.name ?? "");
  const [phone, setPhone] = useState(initialMechanic?.phone ?? "");
  const [mechanic, setMechanic] = useState(initialMechanic);
  const [manualCode, setManualCode] = useState("");
  const [rewards, setRewards] = useState(initialRewards);
  const [pending, startTransition] = useTransition();

  function refreshMechanicPage(mechanicId: string) {
    router.replace(`/tich-diem?mechanicId=${mechanicId}`);
    router.refresh();
  }

  function handleSelectMechanic() {
    startTransition(async () => {
      const result = await findOrCreateMechanic({ name, phone });
      if (!result.success || !result.mechanicId) {
        toast.error(result.error ?? result.message);
        return;
      }
      toast.success(result.message);
      setMechanic({
        id: result.mechanicId,
        name,
        phone,
        points: result.points ?? 0,
      });
      refreshMechanicPage(result.mechanicId);
    });
  }

  function handleScan(raw: string) {
    if (!mechanic) {
      toast.error("Chọn / tạo thợ trước khi quét.");
      return;
    }
    startTransition(async () => {
      const result = await scanLoyaltyCode({
        code: raw,
        mechanicId: mechanic.id,
      });
      if (!result.success) {
        toast.error(result.error ?? result.message);
        return;
      }
      toast.success(result.message);
      if (typeof result.points === "number") {
        setMechanic((prev) =>
          prev ? { ...prev, points: result.points ?? prev.points } : prev,
        );
      }
      refreshMechanicPage(mechanic.id);
    });
  }

  function handleManualSubmit() {
    if (!manualCode.trim()) {
      toast.error("Nhập mã trước.");
      return;
    }
    handleScan(manualCode.trim());
    setManualCode("");
  }

  function handleRedeem(rewardId: string) {
    if (!mechanic) {
      toast.error("Chọn thợ trước khi đổi quà.");
      return;
    }
    startTransition(async () => {
      const result = await redeemReward({
        mechanicId: mechanic.id,
        rewardId,
      });
      if (!result.success) {
        toast.error(result.error ?? result.message);
        return;
      }
      toast.success(result.message);
      if (typeof result.points === "number") {
        setMechanic((prev) =>
          prev ? { ...prev, points: result.points ?? prev.points } : prev,
        );
      }
      setRewards((prev) =>
        prev.map((r) =>
          r.id === rewardId ? { ...r, stock: Math.max(0, r.stock - 1) } : r,
        ),
      );
      refreshMechanicPage(mechanic.id);
    });
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          Tích điểm thợ
        </h1>
        <p className="text-sm text-muted-foreground">
          Quét QR nắp chai/thùng (mã một lần), cộng điểm và đổi quà chống bán phá
          giá.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="bg-background shadow-none ring-1 ring-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <UserRound className="size-4" aria-hidden />
              Hồ sơ thợ
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            <div className="grid gap-2">
              <Label htmlFor="mechanic-name">Họ tên</Label>
              <Input
                id="mechanic-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nguyễn Văn A"
                disabled={pending}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="mechanic-phone">Số điện thoại</Label>
              <Input
                id="mechanic-phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0901234567"
                disabled={pending}
              />
            </div>
            <Button
              type="button"
              disabled={pending}
              onClick={handleSelectMechanic}
            >
              {pending ? "Đang lưu..." : "Chọn / tạo thợ"}
            </Button>
            {mechanic ? (
              <div className="rounded-md border border-border bg-muted/30 px-3 py-2 text-sm">
                <p className="font-medium">{mechanic.name}</p>
                <p className="text-muted-foreground">{mechanic.phone}</p>
                <p className="mt-1 text-lg font-semibold tabular-nums text-sky-700">
                  {mechanic.points} điểm
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Chưa chọn thợ — cần tạo hồ sơ trước khi quét.
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="bg-background shadow-none ring-1 ring-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <QrCode className="size-4" aria-hidden />
              Quét / nhập mã
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <QRScanner disabled={!mechanic || pending} onScan={handleScan} />
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                placeholder="LOYALTY:BOTTLE-001"
                disabled={!mechanic || pending}
              />
              <Button
                type="button"
                variant="secondary"
                disabled={!mechanic || pending}
                onClick={handleManualSubmit}
              >
                Cộng điểm
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-background shadow-none ring-1 ring-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <Gift className="size-4" aria-hidden />
            Đổi quà
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {rewards.map((reward) => (
              <div
                key={reward.id}
                className="flex flex-col rounded-lg border border-border p-3"
              >
                <p className="font-medium">{reward.name}</p>
                <p className="mt-1 text-sm tabular-nums text-muted-foreground">
                  {reward.pointsCost} điểm · còn {reward.stock}
                </p>
                <Button
                  type="button"
                  size="sm"
                  className="mt-3"
                  disabled={
                    pending ||
                    !mechanic ||
                    reward.stock <= 0 ||
                    (mechanic?.points ?? 0) < reward.pointsCost
                  }
                  onClick={() => handleRedeem(reward.id)}
                >
                  Đổi quà
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-background shadow-none ring-1 ring-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">
            Lịch sử điểm
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Thời gian</TableHead>
                <TableHead>Loại</TableHead>
                <TableHead>Ghi chú</TableHead>
                <TableHead className="text-right">Điểm</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {initialLedger.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="h-20 text-center text-muted-foreground"
                  >
                    Chưa có giao dịch điểm.
                  </TableCell>
                </TableRow>
              ) : (
                initialLedger.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="tabular-nums text-muted-foreground">
                      {new Date(row.createdAt).toLocaleString("vi-VN")}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          row.reason === "SCAN" ? "secondary" : "outline"
                        }
                      >
                        {row.reason === "SCAN" ? "Quét mã" : "Đổi quà"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {row.note || "—"}
                    </TableCell>
                    <TableCell
                      className={`text-right font-medium tabular-nums ${
                        row.delta >= 0 ? "text-emerald-700" : "text-destructive"
                      }`}
                    >
                      {row.delta >= 0 ? `+${row.delta}` : row.delta}
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
