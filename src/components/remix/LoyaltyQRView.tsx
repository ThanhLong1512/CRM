"use client";

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import { Customer } from "../types";
import confetti from "canvas-confetti";
import { soundFX } from "../utils/audio";
import {
  QrCode,
  Sparkles,
  Gift,
  Wrench,
  Scan,
  X,
} from "lucide-react";

const QRScanner = dynamic(
  () =>
    import("@/components/features/QRScanner").then((mod) => mod.QRScanner),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-64 items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 text-sm text-slate-500">
        Đang tải camera...
      </div>
    ),
  },
);

export type LoyaltyScanResult = {
  success: boolean;
  awarded?: number;
  points?: number;
  message: string;
};

interface LoyaltyQRViewProps {
  customers: Customer[];
  onAddLoyaltyPoints: (customerId: string, points: number) => void;
  onScanLoyaltyCode?: (input: {
    code: string;
    mechanicName: string;
    mechanicPhone: string;
  }) => Promise<LoyaltyScanResult> | LoyaltyScanResult | void;
}

interface RewardItem {
  id: string;
  name: string;
  requiredPoints: number;
  icon: string;
  category: string;
  description: string;
  badge: string;
}

const SAMPLE_QR_CAPS = [
  {
    code: "BOTTLE-001",
    points: 10,
    label: "Tem nắp BOTTLE-001 (+10 điểm)",
  },
  {
    code: "BOTTLE-003",
    points: 15,
    label: "Tem nắp BOTTLE-003 (+15 điểm)",
  },
  {
    code: "BOTTLE-005",
    points: 20,
    label: "Tem nắp BOTTLE-005 (+20 điểm)",
  },
  {
    code: "DRUM-001",
    points: 50,
    label: "Tem phuy DRUM-001 (+50 điểm)",
  },
  {
    code: "TEST-100",
    points: 100,
    label: "Mã thử TEST-100 (+100 điểm)",
  },
];

const REWARDS: RewardItem[] = [
  {
    id: "RW-01",
    name: "Áo Thun Kỹ Thuật Viên Castrol Cao Cấp",
    requiredPoints: 100,
    icon: "👕",
    category: "Trang phục",
    description:
      "Chất liệu thun cá sấu 4 chiều thấm hút dầu mỡ chuyên nghiệp",
    badge: "Dễ đạt nhất",
  },
  {
    id: "RW-02",
    name: "Nón Bảo Hiểm 3/4 Sơn Mờ Chống Trầy",
    requiredPoints: 300,
    icon: "🪖",
    category: "Bảo hộ",
    description:
      "Đạt chuẩn an toàn Quatest 3 cho thợ máy đi giao nhận phụ tùng",
    badge: "Phổ biến",
  },
  {
    id: "RW-03",
    name: "Bộ Khóa Vặn Ốc & Cờ-lê Chrome Vanadium 24 Món",
    requiredPoints: 1000,
    icon: "🔧",
    category: "Đồ nghề sửa chữa",
    description: "Bộ công cụ tiêu chuẩn gara Đức thép cứng không gỉ",
    badge: "Cao cấp",
  },
  {
    id: "RW-04",
    name: "Phiếu Xăng / Nạp Tiền Điện Thoại 500.000 đ",
    requiredPoints: 1500,
    icon: "⛽",
    category: "Thẻ quà tặng",
    description:
      "Mã voucher nạp tiền trực tiếp vào tài khoản ngân hàng hoặc ví",
    badge: "Hot VIP",
  },
];

export default function LoyaltyQRView({
  customers,
  onAddLoyaltyPoints,
  onScanLoyaltyCode,
}: LoyaltyQRViewProps) {
  const defaultCustomer = useMemo(() => {
    return (
      customers.find((c) => c.phone === "0918334455") ||
      customers.find((c) => c.loyaltyPoints !== undefined) ||
      customers[0]
    );
  }, [customers]);

  const [mechanicName, setMechanicName] = useState(
    defaultCustomer?.name ?? "Chú Ba (Thợ máy)",
  );
  const [mechanicPhone, setMechanicPhone] = useState(
    defaultCustomer?.phone ?? "0918334455",
  );
  const [displayPoints, setDisplayPoints] = useState(
    defaultCustomer?.loyaltyPoints ?? 1250,
  );
  const [manualCodeInput, setManualCodeInput] = useState("");
  const [scanPending, setScanPending] = useState(false);
  const [rewardClaimModal, setRewardClaimModal] = useState<RewardItem | null>(
    null,
  );
  const [successCelebration, setSuccessCelebration] = useState<{
    points: number;
    productTitle: string;
  } | null>(null);

  const applyCustomerPreset = (customerId: string) => {
    const c = customers.find((row) => row.id === customerId);
    if (!c) return;
    setMechanicName(c.name);
    setMechanicPhone(c.phone || "");
    setDisplayPoints(c.loyaltyPoints ?? 0);
  };

  const triggerCelebration = (points: number, productTitle: string) => {
    soundFX.playTing();
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#F59E0B", "#10B981", "#3B82F6", "#EF4444"],
      });
    } catch {
      // Confetti fallback
    }
    setSuccessCelebration({ points, productTitle });
  };

  const handleProcessScan = async (
    codeToScan: string,
    title = "Tem nắp chai",
  ) => {
    const code = codeToScan.trim();
    if (!code || scanPending) return;
    if (!mechanicName.trim() || !mechanicPhone.trim()) {
      return;
    }

    setScanPending(true);
    try {
      if (!onScanLoyaltyCode) {
        triggerCelebration(10, title);
        return;
      }
      const result = await onScanLoyaltyCode({
        code,
        mechanicName: mechanicName.trim(),
        mechanicPhone: mechanicPhone.trim(),
      });
      if (!result || !result.success) return;
      const awarded = result.awarded ?? 0;
      if (typeof result.points === "number") {
        setDisplayPoints(result.points);
      } else if (awarded > 0) {
        setDisplayPoints((prev) => prev + awarded);
      }
      triggerCelebration(awarded || 10, title);
      setManualCodeInput("");
    } finally {
      setScanPending(false);
    }
  };

  return (
    <div id="loyalty-qr-view" className="w-full space-y-6">
      <div className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs sm:flex-row sm:items-center">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-extrabold tracking-tight text-slate-900 sm:text-2xl">
              Trạm Quét QR Tích Điểm Thợ Máy
            </h2>
            <span className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-900">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>Gamification v2.0</span>
            </span>
          </div>
          <p className="mt-0.5 text-xs text-slate-500">
            Quét tem chống giả dưới nắp xô/phuy dầu nhớt — camera thật + mã seed
            BOTTLE-* / TEST-100
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:items-end">
          <label className="text-xs font-semibold text-slate-500">
            Gợi ý từ khách hàng:
          </label>
          <select
            defaultValue={defaultCustomer?.id ?? ""}
            onChange={(e) => applyCustomerPreset(e.target.value)}
            className="cursor-pointer rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-900 focus:border-amber-500 focus:outline-none"
          >
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.phone || "—"})
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="space-y-4 lg:col-span-5">
          <div className="relative overflow-hidden rounded-2xl border border-slate-700/80 bg-gradient-to-br from-slate-900 via-slate-800 to-amber-950 p-6 text-white shadow-xl">
            <div className="absolute -right-8 -bottom-8 h-40 w-40 rounded-full bg-amber-500/10 blur-2xl pointer-events-none" />

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500 text-xs font-black text-slate-950">
                  LUB
                </div>
                <div>
                  <div className="font-mono text-[10px] font-bold tracking-wider text-amber-400 uppercase">
                    MECHANIC PRIVILEGE PASS
                  </div>
                  <div className="text-xs font-bold text-slate-200">
                    Thẻ Thành Viên Thợ Máy
                  </div>
                </div>
              </div>
              <span className="rounded-full border border-amber-500/40 bg-amber-500/20 px-2.5 py-0.5 font-mono text-[11px] font-bold text-amber-300">
                {displayPoints >= 1000
                  ? "HẠNG KIM CƯƠNG"
                  : displayPoints >= 300
                    ? "HẠNG VÀNG"
                    : "HẠNG BẠC"}
              </span>
            </div>

            <div className="mt-6 space-y-3">
              <div>
                <label className="text-[10px] text-slate-400">Tên thợ máy</label>
                <input
                  value={mechanicName}
                  onChange={(e) => setMechanicName(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-900/60 px-3 py-2 text-sm font-semibold text-white focus:border-amber-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400">SĐT thợ</label>
                <input
                  value={mechanicPhone}
                  onChange={(e) => setMechanicPhone(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-900/60 px-3 py-2 font-mono text-sm text-white focus:border-amber-500 focus:outline-none"
                  placeholder="09xxxxxxxx"
                />
              </div>
            </div>

            <div className="mt-6 flex items-baseline justify-between border-t border-slate-700/60 pt-4">
              <div>
                <div className="text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
                  Điểm thưởng khả dụng
                </div>
                <div className="mt-0.5 flex items-baseline gap-1.5 font-mono text-4xl font-black tracking-tight text-amber-400">
                  <span>{displayPoints.toLocaleString()}</span>
                  <span className="text-sm font-bold text-amber-300">PTS</span>
                </div>
              </div>
              <Wrench className="h-5 w-5 text-amber-400" />
            </div>
          </div>

          <div className="space-y-2.5 rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
            <div className="flex items-center justify-between text-xs font-bold text-slate-800">
              <span>Mã QR nắp thử (seed DB)</span>
              <span className="text-[10px] font-semibold text-amber-600">
                Nhấn để quét
              </span>
            </div>
            <div className="space-y-2">
              {SAMPLE_QR_CAPS.map((sample) => (
                <button
                  key={sample.code}
                  type="button"
                  disabled={scanPending}
                  onClick={() =>
                    void handleProcessScan(
                      sample.code,
                      sample.label.split("(")[0]?.trim() ?? sample.code,
                    )
                  }
                  className="group flex w-full cursor-pointer items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-left text-xs font-semibold text-slate-800 transition-colors hover:border-amber-300 hover:bg-amber-50 disabled:opacity-50"
                >
                  <div className="flex items-center gap-2">
                    <QrCode className="h-4 w-4 text-amber-600" />
                    <span>{sample.label}</span>
                  </div>
                  <span className="rounded bg-emerald-100 px-2 py-0.5 font-mono text-[10px] font-bold text-emerald-800">
                    +{sample.points} pts
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-xs lg:col-span-7">
          <div>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="flex items-center gap-2 text-base font-bold text-slate-900">
                  <Scan className="h-5 w-5 text-amber-600" />
                  <span>Khung Quét Camera Tem Nắp Chai</span>
                </h3>
                <p className="mt-0.5 text-xs text-slate-500">
                  Hướng camera vào mã QR in chìm dưới nắp xô hoặc tem cào chống
                  giả
                </p>
              </div>
              <div className="flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
                <span>{scanPending ? "Đang xử lý..." : "Camera sẵn sàng"}</span>
              </div>
            </div>

            <QRScanner
              disabled={scanPending || !mechanicName || !mechanicPhone}
              onScan={(text) => {
                void handleProcessScan(text, "Tem nắp quét camera");
              }}
            />

            <div className="mt-4 flex items-center gap-2">
              <input
                type="text"
                placeholder="Hoặc nhập mã: BOTTLE-001, TEST-100..."
                value={manualCodeInput}
                onChange={(e) => setManualCodeInput(e.target.value)}
                className="flex-1 rounded-lg border border-slate-200 px-3 py-2 font-mono text-xs focus:border-amber-500 focus:outline-none"
              />
              <button
                type="button"
                disabled={scanPending}
                onClick={() =>
                  void handleProcessScan(manualCodeInput, "Tem nhập tay")
                }
                className="cursor-pointer rounded-lg bg-amber-500 px-4 py-2 text-xs font-bold text-slate-950 shadow-2xs transition-colors hover:bg-amber-600 disabled:opacity-50"
              >
                Kích Hoạt
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
        <div>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="flex items-center gap-2 text-lg font-bold text-slate-900">
                <Gift className="h-5 w-5 text-amber-600" />
                <span>Kệ Quà Tặng Đổi Điểm Thợ Máy</span>
              </h3>
              <p className="mt-0.5 text-xs text-slate-500">
                Điểm tích lũy đổi hiện vật khi Sales đi tuyến
              </p>
            </div>
            <div className="rounded-lg bg-slate-100 px-3 py-1.5 font-mono text-xs font-bold text-slate-700">
              Điểm hiện tại:{" "}
              <strong className="text-amber-700">{displayPoints} PTS</strong>
            </div>
          </div>

          <div className="relative mt-6">
            <div className="flex h-2.5 overflow-hidden rounded-full bg-slate-100 text-xs">
              <div
                style={{
                  width: `${Math.min(100, (displayPoints / 1500) * 100)}%`,
                }}
                className="flex flex-col justify-center bg-gradient-to-r from-amber-400 to-amber-600 text-center whitespace-nowrap text-white shadow-none transition-all duration-500"
              />
            </div>
            <div className="mt-2 flex justify-between font-mono text-[11px] font-semibold text-slate-500">
              <span
                className={
                  displayPoints >= 100 ? "font-bold text-emerald-700" : ""
                }
              >
                100 PTS
              </span>
              <span
                className={
                  displayPoints >= 300 ? "font-bold text-emerald-700" : ""
                }
              >
                300 PTS
              </span>
              <span
                className={
                  displayPoints >= 1000 ? "font-bold text-emerald-700" : ""
                }
              >
                1.000 PTS
              </span>
              <span
                className={
                  displayPoints >= 1500 ? "font-bold text-emerald-700" : ""
                }
              >
                1.500 PTS
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {REWARDS.map((item) => {
            const isEligible = displayPoints >= item.requiredPoints;
            const pointsNeeded = item.requiredPoints - displayPoints;

            return (
              <div
                key={item.id}
                className={`flex flex-col justify-between rounded-xl border p-4 transition-all ${
                  isEligible
                    ? "border-amber-200 bg-white shadow-xs hover:shadow-md"
                    : "border-slate-200 bg-slate-50/60 opacity-80"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="rounded-xl bg-slate-100 p-2 text-3xl">
                      {item.icon}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        isEligible
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-slate-200 text-slate-600"
                      }`}
                    >
                      {item.badge}
                    </span>
                  </div>
                  <h4 className="mt-3 text-sm leading-snug font-bold text-slate-900">
                    {item.name}
                  </h4>
                  <p className="mt-1 line-clamp-2 text-[11px] text-slate-500">
                    {item.description}
                  </p>
                </div>
                <div className="mt-4 border-t border-slate-100 pt-3">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-400">
                      Định mức:
                    </span>
                    <span className="font-mono text-sm font-black text-amber-700">
                      {item.requiredPoints} PTS
                    </span>
                  </div>
                  {isEligible ? (
                    <button
                      type="button"
                      onClick={() => setRewardClaimModal(item)}
                      className="flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-lg bg-amber-500 py-2 text-xs font-bold text-slate-950 shadow-2xs transition-colors hover:bg-amber-600"
                    >
                      <Gift className="h-3.5 w-3.5" />
                      <span>Đổi Quà Ngay</span>
                    </button>
                  ) : (
                    <div className="w-full rounded-lg bg-slate-100 py-2 text-center font-mono text-[11px] font-semibold text-slate-400">
                      Cần thêm {pointsNeeded} PTS
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {successCelebration && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm space-y-4 rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-2xl">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 text-2xl text-amber-600 shadow-inner">
              🎉
            </div>
            <div>
              <span className="font-mono text-xs font-bold tracking-wider text-amber-600 uppercase">
                Xác thực tem chính hãng thành công
              </span>
              <h3 className="mt-1 font-mono text-3xl font-black text-slate-900">
                +{successCelebration.points} PTS
              </h3>
              <p className="mt-1 text-xs text-slate-600">
                Đã cộng điểm từ{" "}
                <strong>{successCelebration.productTitle}</strong> cho{" "}
                <strong>{mechanicName}</strong>.
              </p>
            </div>
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs font-medium text-amber-900">
              Số dư điểm:{" "}
              <strong>{displayPoints.toLocaleString()} PTS</strong>
            </div>
            <button
              type="button"
              onClick={() => setSuccessCelebration(null)}
              className="w-full cursor-pointer rounded-xl bg-amber-500 py-2.5 text-xs font-bold text-slate-950 shadow-xs hover:bg-amber-600"
            >
              Tiếp Tục Quét Mã
            </button>
          </div>
        </div>
      )}

      {rewardClaimModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h4 className="text-base font-bold text-slate-900">
                  Phiếu Đổi Quà Thợ Máy
                </h4>
                <p className="text-xs text-slate-500">
                  Demo UI — đổi quà DB qua LoyaltyPageClient nếu cần
                </p>
              </div>
              <button
                type="button"
                onClick={() => setRewardClaimModal(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-4 text-center">
              <div className="text-3xl">{rewardClaimModal.icon}</div>
              <div className="text-sm font-bold text-slate-900">
                {rewardClaimModal.name}
              </div>
              <div className="font-mono text-xs text-slate-500">
                Khấu trừ:{" "}
                <strong>{rewardClaimModal.requiredPoints} PTS</strong>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                const match = customers.find(
                  (c) => c.phone === mechanicPhone || c.name === mechanicName,
                );
                if (match) {
                  onAddLoyaltyPoints(
                    match.id,
                    -rewardClaimModal.requiredPoints,
                  );
                }
                setDisplayPoints((p) =>
                  Math.max(0, p - rewardClaimModal.requiredPoints),
                );
                soundFX.playSuccess();
                setRewardClaimModal(null);
              }}
              className="w-full cursor-pointer rounded-xl bg-emerald-600 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-700"
            >
              Xác Nhận Đã Trao Quà &amp; Khấu Trừ Điểm
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
