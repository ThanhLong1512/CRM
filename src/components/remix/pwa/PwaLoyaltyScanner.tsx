"use client";
import { useState, useRef, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { soundFX } from '../../utils/audio';
import {
  QrCode,
  Award,
  Sparkles,
  Gift,
  Camera,
  CheckCircle2,
  X,
  Flame,
  ChevronRight,
  Barcode,
  Keyboard,
  Wrench,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';

interface RewardItem {
  id: string;
  name: string;
  pointsCost: number;
  imageIcon: string;
  tag: string;
}

const REWARDS: RewardItem[] = [
  {
    id: 'tshirt',
    name: 'Áo thun thợ máy cao cấp',
    pointsCost: 500,
    imageIcon: '👕',
    tag: 'Chất vải co giãn, chống dầu nhớt',
  },
  {
    id: 'helmet',
    name: 'Nón bảo hiểm 3/4 Royal',
    pointsCost: 1000,
    imageIcon: '🪖',
    tag: 'Tiêu chuẩn an toàn Quốc Gia',
  },
  {
    id: 'toolset',
    name: 'Bộ cờ lê lực Stanley 12 món',
    pointsCost: 3000,
    imageIcon: '🔧',
    tag: 'Thép Chrome Vanadium siêu cứng',
  },
  {
    id: 'jacket',
    name: 'Áo khoác gió Racing',
    pointsCost: 1500,
    imageIcon: '🧥',
    tag: 'Chống nước, phản quang đêm',
  },
];

export default function PwaLoyaltyScanner() {
  const [mechanicPoints, setMechanicPoints] = useState<number>(1450);
  const [isScanning, setIsScanning] = useState<boolean>(true);
  const [scanSuccessModal, setScanSuccessModal] = useState<{
    pointsAdded: number;
    productScanned: string;
    qrCode: string;
  } | null>(null);
  const [redeemSuccessModal, setRedeemSuccessModal] = useState<RewardItem | null>(null);
  const [showManualInput, setShowManualInput] = useState<boolean>(false);
  const [manualCode, setManualCode] = useState<string>('');
  const [screenFlashed, setScreenFlashed] = useState<boolean>(false);

  // Trigger celebration
  const fireCelebration = (points: number, productName: string, code: string) => {
    // Screen flash green border
    setScreenFlashed(true);
    setTimeout(() => setScreenFlashed(false), 350);

    // Haptics
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate([100, 50, 100]);
      } catch {}
    }

    // Sound
    soundFX.playTing();

    // Confetti
    confetti({
      particleCount: 60,
      spread: 70,
      origin: { y: 0.6 },
    });

    setMechanicPoints((prev) => prev + points);
    setScanSuccessModal({
      pointsAdded: points,
      productScanned: productName,
      qrCode: code,
    });
  };

  // Simulate scanning a bottle cap QR
  const handleSimulateScan = () => {
    const caps = [
      { name: 'Can nhớt Castrol Magnatec 4L', points: 50, code: 'QR-CAS-MAG-8891' },
      { name: 'Xô dầu nhớt Total Rubia TIR 18L', points: 120, code: 'QR-TOT-RUB-7723' },
      { name: 'Phuy dầu thủy lực Shell Tellus S2 200L', points: 300, code: 'QR-SHL-TEL-9901' },
    ];
    const picked = caps[Math.floor(Math.random() * caps.length)];
    fireCelebration(picked.points, picked.name, picked.code);
  };

  // Handle manual code submit
  const handleConfirmManualCode = () => {
    if (!manualCode.trim()) return;
    setShowManualInput(false);
    fireCelebration(50, 'Can nhớt Shell Rimula R4X 4L', manualCode.trim().toUpperCase());
    setManualCode('');
  };

  // Redeem Reward
  const handleRedeemReward = (reward: RewardItem) => {
    if (mechanicPoints < reward.pointsCost) return;
    soundFX.playSuccess();
    setMechanicPoints((prev) => prev - reward.pointsCost);
    setRedeemSuccessModal(reward);
  };

  return (
    <div
      id="pwa-loyalty-module"
      className={`flex flex-col h-full bg-slate-900 text-white select-none pb-28 transition-all ${
        screenFlashed ? 'ring-8 ring-emerald-500 ring-inset' : ''
      }`}
    >
      <div className="p-4 max-w-lg mx-auto w-full space-y-4">
        {/* Section 1: Digital Mechanic ID Card (1.58:1 Ratio) */}
        <div
          id="pwa-mechanic-id-card"
          className="relative rounded-3xl p-5 overflow-hidden shadow-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-amber-950/80 border border-slate-700/80 flex flex-col justify-between"
          style={{ aspectRatio: '1.58 / 1' }}
        >
          {/* Ambient Glow */}
          <div className="absolute top-0 right-0 w-44 h-44 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-36 h-36 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />

          {/* Card Top: Garage Name & Tier Badge */}
          <div className="flex items-start justify-between relative z-10">
            <div>
              <div className="flex items-center gap-1.5 text-xs text-amber-400 font-bold tracking-wider uppercase font-mono">
                <Wrench className="w-3.5 h-3.5" />
                <span>Garage Minh Đức &bull; Quận 7</span>
              </div>
              <h3 className="text-lg font-black text-white mt-0.5 tracking-tight">
                Nguyễn Văn Tuấn
              </h3>
            </div>

            <div className="px-3 py-1 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black text-[10px] uppercase font-mono flex items-center gap-1 shadow-md">
              <Award className="w-3 h-3 text-slate-950" />
              <span>THỢ VÀNG (GOLD)</span>
            </div>
          </div>

          {/* Card Center / Bottom: Big Monospace Points Counter */}
          <div className="relative z-10 flex items-end justify-between border-t border-slate-800/80 pt-3">
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Điểm Tích Lũy Nắp Chai:
              </div>
              <div className="text-4xl font-black font-mono text-amber-400 tracking-tight flex items-baseline gap-1">
                <span>{mechanicPoints.toLocaleString('vi-VN')}</span>
                <span className="text-xs font-sans text-amber-300 font-bold uppercase">Điểm</span>
              </div>
            </div>

            <div className="text-right">
              <div className="text-[10px] text-slate-400 font-mono">Mã Thợ Máy:</div>
              <div className="text-xs font-mono font-bold text-slate-200">#MEC-7092</div>
            </div>
          </div>
        </div>

        {/* Section 2: QR Scanner Viewport with Animated Laser Line */}
        <div className="bg-slate-950 rounded-3xl border border-slate-800 p-4 space-y-3 shadow-inner">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <QrCode className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-bold text-slate-200">
                Quét Tem / Mã QR Nắp Thùng Nhớt
              </span>
            </div>
            <button
              onClick={() => setShowManualInput(true)}
              className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer"
            >
              <Keyboard className="w-3.5 h-3.5" />
              <span>Nhập tay</span>
            </button>
          </div>

          {/* Viewfinder Area (260px x 260px center with darkened frosted surround) */}
          <div className="relative w-full h-[260px] rounded-2xl overflow-hidden bg-black flex items-center justify-center border border-slate-800">
            {/* Dark Frosted Surround */}
            <div className="absolute inset-0 bg-black/40 backdrop-blur-2xs" />

            {/* Clear 200px Square Scanning Window */}
            <div className="relative w-48 h-48 border-2 border-amber-400/80 rounded-2xl shadow-[0_0_20px_rgba(245,158,11,0.25)] flex items-center justify-center overflow-hidden">
              {/* Animated Continuous Laser Scanner Line */}
              <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-amber-400 to-transparent shadow-[0_0_12px_#F59E0B] animate-[bounce_2s_infinite]" />

              {/* Viewfinder Corner Accents */}
              <div className="absolute top-1 left-1 w-3 h-3 border-t-2 border-l-2 border-amber-400" />
              <div className="absolute top-1 right-1 w-3 h-3 border-t-2 border-r-2 border-amber-400" />
              <div className="absolute bottom-1 left-1 w-3 h-3 border-b-2 border-l-2 border-amber-400" />
              <div className="absolute bottom-1 right-1 w-3 h-3 border-b-2 border-r-2 border-amber-400" />

              <div className="text-center text-[10px] text-amber-200/60 font-mono select-none pointer-events-none">
                Đưa mã QR trên nắp can vào khung hình
              </div>
            </div>

            {/* Simulated Live Camera trigger button */}
            <button
              onClick={handleSimulateScan}
              className="absolute bottom-3 px-4 py-2 rounded-xl bg-amber-500/90 hover:bg-amber-400 active:scale-95 text-slate-950 text-xs font-black flex items-center gap-1.5 shadow-lg shadow-amber-500/30 transition-all cursor-pointer font-mono"
            >
              <Camera className="w-4 h-4" />
              <span>Chạm Mô Phỏng Quét Nắp (+Điểm)</span>
            </button>
          </div>
        </div>

        {/* Section 3: Tiered Rewards Catalog & Next Milestone */}
        <div className="space-y-3">
          {/* Milestone Progress Bar */}
          <div className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300 font-medium">Mục tiêu: Đổi Áo Thun Xịn</span>
              <span className="font-mono text-amber-400 font-bold">
                {mechanicPoints} / 1.500 điểm
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-700 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-emerald-400 transition-all duration-300 rounded-full"
                style={{ width: `${Math.min(100, (mechanicPoints / 1500) * 100)}%` }}
              />
            </div>
            <div className="text-[10px] text-slate-400 text-right">
              {mechanicPoints >= 1500
                ? 'Đã đủ điều kiện đổi quà!'
                : `Còn thiếu ${1500 - mechanicPoints} điểm nữa`}
            </div>
          </div>

          {/* 2-Column Mobile-Optimized Gift Grid */}
          <div>
            <div className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Gift className="w-4 h-4 text-amber-400" />
              <span>Đổi Quà Tức Thì Từ Cốp Xe Sales</span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {REWARDS.map((item) => {
                const canAfford = mechanicPoints >= item.pointsCost;
                return (
                  <div
                    key={item.id}
                    className="p-3 rounded-2xl bg-slate-800/90 border border-slate-700 flex flex-col justify-between space-y-2 shadow-sm"
                  >
                    <div>
                      <div className="w-10 h-10 rounded-xl bg-slate-700 flex items-center justify-center text-xl mb-1.5">
                        {item.imageIcon}
                      </div>
                      <h4 className="font-bold text-xs text-white leading-tight">{item.name}</h4>
                      <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">{item.tag}</p>
                    </div>

                    <div className="pt-2 border-t border-slate-700/80">
                      <div className="text-xs font-black font-mono text-amber-400 mb-1.5">
                        {item.pointsCost} Điểm
                      </div>

                      <button
                        onClick={() => handleRedeemReward(item)}
                        disabled={!canAfford}
                        className={`w-full h-9 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1 transition-all ${
                          canAfford
                            ? 'bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 shadow-md shadow-emerald-500/20 cursor-pointer'
                            : 'bg-slate-700 text-slate-400 cursor-not-allowed text-[11px]'
                        }`}
                      >
                        {canAfford ? (
                          <>
                            <span>ĐỔI NGAY</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </>
                        ) : (
                          <span>Thiếu {item.pointsCost - mechanicPoints}đ</span>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Success Scan Celebration Modal */}
      {scanSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs select-none">
          <div className="bg-slate-900 border border-amber-500/50 rounded-3xl max-w-sm w-full p-6 text-center space-y-4 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-400 text-amber-400 flex items-center justify-center mx-auto text-3xl shadow-lg shadow-amber-500/20 animate-bounce">
              🎉
            </div>

            <div>
              <span className="text-[11px] font-mono text-amber-400 font-bold uppercase tracking-wider">
                Tích Điểm Thành Công
              </span>
              <h3 className="text-3xl font-black font-mono text-amber-400 mt-1">
                +{scanSuccessModal.pointsAdded} ĐIỂM
              </h3>
              <p className="text-xs text-slate-300 mt-1 font-medium">
                {scanSuccessModal.productScanned}
              </p>
              <div className="text-[10px] font-mono text-slate-500 mt-0.5">
                Mã nắp: {scanSuccessModal.qrCode}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-800 text-xs text-slate-300 font-mono">
              Tổng điểm hiện có: <strong className="text-white">{mechanicPoints} điểm</strong>
            </div>

            <button
              onClick={() => setScanSuccessModal(null)}
              className="w-full h-12 min-h-[48px] rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm shadow-md cursor-pointer font-mono"
            >
              TIẾP TỤC QUÉT
            </button>
          </div>
        </div>
      )}

      {/* 1-Time Redemption Barcode Modal for immediate gift handover */}
      {redeemSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs select-none">
          <div className="bg-white text-slate-900 rounded-3xl max-w-sm w-full p-6 text-center space-y-4 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="text-xs font-bold text-slate-400 uppercase font-mono">
                Phiếu Đổi Quà Tại Xe
              </span>
              <button
                onClick={() => setRedeemSuccessModal(null)}
                className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-4xl">{redeemSuccessModal.imageIcon}</div>

            <div>
              <h4 className="text-base font-extrabold text-slate-900">
                {redeemSuccessModal.name}
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Đã trừ {redeemSuccessModal.pointsCost} điểm từ tài khoản thợ
              </p>
            </div>

            {/* Verifiable Barcode for Sales Rep to Hand Over Gift */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <Barcode className="w-full h-14 text-slate-800" />
              <div className="font-mono text-xs font-bold tracking-widest text-slate-700">
                *RDM-9941-TUAN*
              </div>
              <div className="text-[10px] text-slate-400">
                Sales quét mã này để xuất quà trực tiếp từ thùng xe
              </div>
            </div>

            <button
              onClick={() => setRedeemSuccessModal(null)}
              className="w-full h-12 min-h-[48px] rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-md cursor-pointer"
            >
              XÁC NHẬN ĐÃ TRAO QUÀ TẬN TAY
            </button>
          </div>
        </div>
      )}

      {/* Manual Code Input Modal */}
      {showManualInput && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs select-none">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-sm w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                <Keyboard className="w-4 h-4 text-amber-400" />
                <span>Nhập Mã Tem Nắp Bằng Tay</span>
              </h4>
              <button
                onClick={() => setShowManualInput(false)}
                className="w-7 h-7 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Dùng trong trường hợp tem nắp chai bị rách hoặc dính dầu mỡ không quét camera được:
            </p>

            <div>
              <input
                type="text"
                placeholder="VD: MAG-4L-7892"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                className="w-full h-12 px-3 rounded-xl bg-slate-800 border border-slate-700 font-mono font-bold text-sm text-amber-400 uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setShowManualInput(false)}
                className="h-11 flex-1 rounded-xl border border-slate-700 text-xs font-semibold text-slate-400 hover:bg-slate-800 cursor-pointer"
              >
                Hủy
              </button>
              <button
                onClick={handleConfirmManualCode}
                className="h-11 flex-1 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md cursor-pointer font-mono"
              >
                Xác Nhận Tích Điểm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
