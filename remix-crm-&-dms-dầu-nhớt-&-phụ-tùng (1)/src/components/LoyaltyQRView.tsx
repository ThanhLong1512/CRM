import { useState } from 'react';
import { Customer } from '../types';
import confetti from 'canvas-confetti';
import { soundFX } from '../utils/audio';
import {
  QrCode,
  Sparkles,
  Award,
  Gift,
  CheckCircle2,
  Clock,
  Shirt,
  Shield,
  Wrench,
  ChevronRight,
  Scan,
  Zap,
  Volume2,
  Barcode,
  X,
  Flame,
} from 'lucide-react';

interface LoyaltyQRViewProps {
  customers: Customer[];
  onAddLoyaltyPoints: (customerId: string, points: number) => void;
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

export default function LoyaltyQRView({
  customers,
  onAddLoyaltyPoints,
}: LoyaltyQRViewProps) {
  // Mechanics list (customers of type 'Thợ' or garages)
  const mechanics = customers.filter((c) => c.type === 'Thợ' || c.loyaltyPoints !== undefined);
  const [selectedMechanicId, setSelectedMechanicId] = useState<string>(
    mechanics[0]?.id || customers[3]?.id || customers[0]?.id
  );

  const activeMechanic = customers.find((c) => c.id === selectedMechanicId) || customers[3] || customers[0];
  const currentPoints = activeMechanic?.loyaltyPoints ?? 1250;

  // Scanner Simulator State
  const [manualCodeInput, setManualCodeInput] = useState('');
  const [isScanningActive, setIsScanningActive] = useState(true);
  const [rewardClaimModal, setRewardClaimModal] = useState<RewardItem | null>(null);
  const [successCelebration, setSuccessCelebration] = useState<{
    points: number;
    productTitle: string;
  } | null>(null);

  // Rewards catalog items
  const REWARDS: RewardItem[] = [
    {
      id: 'RW-01',
      name: 'Áo Thun Kỹ Thuật Viên Castrol Cao Cấp',
      requiredPoints: 100,
      icon: '👕',
      category: 'Trang phục',
      description: 'Chất liệu thun cá sấu 4 chiều thấm hút dầu mỡ chuyên nghiệp',
      badge: 'Dễ đạt nhất',
    },
    {
      id: 'RW-02',
      name: 'Nón Bảo Hiểm 3/4 Sơn Mờ Chống Trầy',
      requiredPoints: 300,
      icon: '🪖',
      category: 'Bảo hộ',
      description: 'Đạt chuẩn an toàn Quatest 3 cho thợ máy đi giao nhận phụ tùng',
      badge: 'Phổ biến',
    },
    {
      id: 'RW-03',
      name: 'Bộ Khóa Vặn Ốc & Cờ-lê Chrome Vanadium 24 Món',
      requiredPoints: 1000,
      icon: '🔧',
      category: 'Đồ nghề sửa chữa',
      description: 'Bộ công cụ tiêu chuẩn gara Đức thép cứng không gỉ',
      badge: 'Cao cấp',
    },
    {
      id: 'RW-04',
      name: 'Phiếu Xăng / Nạp Tiền Điện Thoại 500.000 đ',
      requiredPoints: 1500,
      icon: '⛽',
      category: 'Thẻ quà tặng',
      description: 'Mã voucher nạp tiền trực tiếp vào tài khoản ngân hàng hoặc ví',
      badge: 'Hot VIP',
    },
  ];

  // Quick Preset Sample QR Caps
  const SAMPLE_QR_CAPS = [
    {
      code: 'ENEOS-PRO-10W40-CAP-30D',
      points: 30,
      label: 'Nắp Xô Eneos 10W-40 (+30 điểm)',
    },
    {
      code: 'CASTROL-CRB-15W40-CAP-50D',
      points: 50,
      label: 'Tem Nắp Xô Castrol Diesel (+50 điểm)',
    },
    {
      code: 'SHELL-TELLUS-DRUM-CAP-100D',
      points: 100,
      label: 'Nắp Phuy Sắt 200L Shell (+100 điểm)',
    },
  ];

  const triggerCelebration = (points: number, productTitle: string) => {
    // 1. Play synthesized Bell/Ting sound
    soundFX.playTing();

    // 2. Fire Confetti
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#F59E0B', '#10B981', '#3B82F6', '#EF4444'],
      });
    } catch {
      // Confetti fallback
    }

    // 3. Update Points
    onAddLoyaltyPoints(activeMechanic.id, points);

    // 4. Show Modal Banner
    setSuccessCelebration({
      points,
      productTitle,
    });
  };

  const handleProcessScan = (codeToScan: string, pointsValue = 50, title = 'Xô Dầu Diesel 15W-40') => {
    if (!codeToScan.trim()) return;
    triggerCelebration(pointsValue, title);
    setManualCodeInput('');
  };

  return (
    <div id="loyalty-qr-view" className="p-6 max-w-6xl mx-auto space-y-6">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">
              Trạm Quét QR Tích Điểm Thợ Máy (Mechanic Loyalty)
            </h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 font-bold border border-amber-300 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>Gamification v2.0</span>
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Quét tem chống giả dưới nắp xô/phuy dầu nhớt, tích lũy điểm thưởng đổi đồ nghề sửa xe và trang thiết bị gara
          </p>
        </div>

        {/* Mechanic Switcher */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-slate-500 whitespace-nowrap">
            Thợ đang quét:
          </label>
          <select
            value={selectedMechanicId}
            onChange={(e) => setSelectedMechanicId(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-bold text-slate-900 focus:outline-none focus:border-amber-500 cursor-pointer"
          >
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.loyaltyPoints || 0} PTS)
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 2. Top Row: Digital Loyalty Card & Scanner Radar Screen */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 5 Cols: Digital Mechanic Card */}
        <div className="lg:col-span-5 space-y-4">
          {/* Card Surface with Sleek Gradient */}
          <div className="rounded-2xl p-6 bg-gradient-to-br from-slate-900 via-slate-800 to-amber-950 text-white shadow-xl border border-slate-700/80 relative overflow-hidden">
            {/* Background pattern */}
            <div className="absolute -right-8 -bottom-8 w-40 h-40 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute top-0 right-0 p-4 opacity-15 text-6xl">
              ⚙️
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-500 text-slate-950 font-black text-xs flex items-center justify-center">
                  LUB
                </div>
                <div>
                  <div className="text-[10px] tracking-wider uppercase font-mono text-amber-400 font-bold">
                    MECHANIC PRIVILEGE PASS
                  </div>
                  <div className="text-xs font-bold text-slate-200">Thẻ Thành Viên Thợ Máy</div>
                </div>
              </div>

              <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold font-mono">
                {currentPoints >= 1000 ? 'HẠNG KIM CƯƠNG' : currentPoints >= 300 ? 'HẠNG VÀNG' : 'HẠNG BẠC'}
              </span>
            </div>

            {/* Mechanic Name & Garage */}
            <div className="mt-6">
              <div className="text-xs text-slate-400">Tên Thợ Máy / Chủ Gara:</div>
              <div className="text-xl font-extrabold text-white mt-0.5 flex items-center gap-2">
                <span>{activeMechanic.name}</span>
                <Wrench className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-xs text-slate-300 font-mono mt-0.5">
                Mã Thợ: {activeMechanic.code || activeMechanic.id} &bull; SĐT: {activeMechanic.phone || '0908...'}
              </div>
            </div>

            {/* Giant Points Display */}
            <div className="mt-6 pt-4 border-t border-slate-700/60 flex items-baseline justify-between">
              <div>
                <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
                  Điểm Thưởng Khả Dụng:
                </div>
                <div className="text-4xl font-black text-amber-400 font-mono tracking-tight flex items-baseline gap-1.5 mt-0.5">
                  <span>{currentPoints.toLocaleString()}</span>
                  <span className="text-sm font-bold text-amber-300">PTS</span>
                </div>
              </div>

              <div className="text-right">
                <div className="text-[10px] text-slate-400">Đã tích lũy năm 2026:</div>
                <div className="text-sm font-bold font-mono text-slate-200">
                  {currentPoints + 350} PTS
                </div>
              </div>
            </div>
          </div>

          {/* Quick Preset Caps for Easy Testing */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-2.5">
            <div className="text-xs font-bold text-slate-800 flex items-center justify-between">
              <span>Mã QR Nắp Xô Thử Nghiệm:</span>
              <span className="text-[10px] text-amber-600 font-semibold">Nhấn để quét ngay</span>
            </div>
            <div className="space-y-2">
              {SAMPLE_QR_CAPS.map((sample) => (
                <button
                  key={sample.code}
                  onClick={() =>
                    handleProcessScan(sample.code, sample.points, sample.label.split('(')[0].trim())
                  }
                  className="w-full text-left p-2.5 rounded-lg bg-slate-50 hover:bg-amber-50 hover:border-amber-300 border border-slate-200 text-xs font-semibold text-slate-800 transition-colors flex items-center justify-between group cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <QrCode className="w-4 h-4 text-amber-600" />
                    <span>{sample.label}</span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold font-mono">
                    +{sample.points} pts
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right 7 Cols: Interactive Radar Laser Scanner Screen */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-xs p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Scan className="w-5 h-5 text-amber-600" />
                  <span>Khung Quét Camera Tem Nắp Chai</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Hướng camera vào mã QR in chìm dưới nắp xô hoặc tem cào chống giả
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Radar Scanner Sẵn Sàng</span>
              </div>
            </div>

            {/* Radar Visual Frame with Vertical Laser Sweep */}
            <div className="relative w-full h-64 bg-slate-950 rounded-xl overflow-hidden flex items-center justify-center border-2 border-slate-800">
              {/* Grid Background Pattern */}
              <div
                className="absolute inset-0 opacity-20"
                style={{
                  backgroundImage: 'radial-gradient(#F59E0B 1px, transparent 1px)',
                  backgroundSize: '20px 20px',
                }}
              />

              {/* Viewfinder Target Corners */}
              <div className="relative w-48 h-48 border-2 border-amber-400/60 rounded-2xl flex items-center justify-center">
                {/* Corner Accents */}
                <span className="absolute -top-1 -left-1 w-5 h-5 border-t-4 border-l-4 border-amber-400 rounded-tl-md" />
                <span className="absolute -top-1 -right-1 w-5 h-5 border-t-4 border-r-4 border-amber-400 rounded-tr-md" />
                <span className="absolute -bottom-1 -left-1 w-5 h-5 border-b-4 border-l-4 border-amber-400 rounded-bl-md" />
                <span className="absolute -bottom-1 -right-1 w-5 h-5 border-b-4 border-r-4 border-amber-400 rounded-br-md" />

                {/* Animated Vertical Laser Line */}
                <div className="absolute inset-x-2 h-1 bg-gradient-to-r from-transparent via-amber-400 to-transparent shadow-[0_0_12px_#F59E0B] animate-[bounce_2.5s_infinite]" />

                <div className="text-center p-3 text-slate-300 select-none">
                  <QrCode className="w-12 h-12 text-amber-400/80 mx-auto animate-pulse" />
                  <span className="text-[11px] block mt-2 text-slate-400 font-mono">
                    Đặt mã QR nắp nhớt vào giữa khung
                  </span>
                </div>
              </div>
            </div>

            {/* Manual Code Input Bar */}
            <div className="mt-4 flex items-center gap-2">
              <input
                type="text"
                placeholder="Hoặc nhập chuỗi 16 số tem cào: e.g. LUB-2026-X8..."
                value={manualCodeInput}
                onChange={(e) => setManualCodeInput(e.target.value)}
                className="flex-1 px-3 py-2 rounded-lg border border-slate-200 text-xs font-mono focus:outline-none focus:border-amber-500"
              />
              <button
                onClick={() => handleProcessScan(manualCodeInput, 40, 'Tem Cào Nhập Tay')}
                className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-2xs transition-colors cursor-pointer"
              >
                Kích Hoạt
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Tiered Rewards Catalog (Kệ Đổi Quà Trực Quan) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6">
        <div>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Gift className="w-5 h-5 text-amber-600" />
                <span>Kệ Quà Tặng Đổi Điểm Thợ Máy (Tiered Rewards Catalog)</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Điểm tích lũy được đổi trực tiếp thành hiện vật hoặc quà tặng trao tận tay thợ khi Sales đi tuyến
              </p>
            </div>

            <div className="text-xs font-mono font-bold text-slate-700 bg-slate-100 px-3 py-1.5 rounded-lg">
              Điểm hiện tại: <strong className="text-amber-700">{currentPoints} PTS</strong>
            </div>
          </div>

          {/* Stepped Progress Bar across milestones */}
          <div className="mt-6 relative">
            <div className="overflow-hidden h-2.5 text-xs flex rounded-full bg-slate-100">
              <div
                style={{ width: `${Math.min(100, (currentPoints / 1500) * 100)}%` }}
                className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-gradient-to-r from-amber-400 to-amber-600 transition-all duration-500"
              />
            </div>

            {/* Milestones Markers */}
            <div className="flex justify-between text-[11px] font-mono text-slate-500 mt-2 font-semibold">
              <span className={currentPoints >= 100 ? 'text-emerald-700 font-bold' : ''}>
                100 PTS (Áo Thun)
              </span>
              <span className={currentPoints >= 300 ? 'text-emerald-700 font-bold' : ''}>
                300 PTS (Nón 3/4)
              </span>
              <span className={currentPoints >= 1000 ? 'text-emerald-700 font-bold' : ''}>
                1.000 PTS (Bộ Đồ Nghề)
              </span>
              <span className={currentPoints >= 1500 ? 'text-emerald-700 font-bold' : ''}>
                1.500 PTS (Thẻ Xăng)
              </span>
            </div>
          </div>
        </div>

        {/* 4 Rewards Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {REWARDS.map((item) => {
            const isEligible = currentPoints >= item.requiredPoints;
            const pointsNeeded = item.requiredPoints - currentPoints;

            return (
              <div
                key={item.id}
                id={`reward-card-${item.id}`}
                className={`rounded-xl border p-4 flex flex-col justify-between transition-all ${
                  isEligible
                    ? 'bg-white border-amber-200 shadow-xs hover:shadow-md'
                    : 'bg-slate-50/60 border-slate-200 opacity-80'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-3xl p-2 rounded-xl bg-slate-100">{item.icon}</span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isEligible
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {item.badge}
                    </span>
                  </div>

                  <h4 className="font-bold text-slate-900 text-sm mt-3 leading-snug">
                    {item.name}
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                    {item.description}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-slate-400 font-medium">Định mức:</span>
                    <span className="text-sm font-black font-mono text-amber-700">
                      {item.requiredPoints} PTS
                    </span>
                  </div>

                  {isEligible ? (
                    <button
                      onClick={() => setRewardClaimModal(item)}
                      className="w-full py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                    >
                      <Gift className="w-3.5 h-3.5" />
                      <span>Đổi Quà Ngay</span>
                    </button>
                  ) : (
                    <div className="w-full py-2 rounded-lg bg-slate-100 text-slate-400 font-semibold text-center text-[11px] font-mono">
                      Cần thêm {pointsNeeded} PTS
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Success Celebration Modal on QR Scan */}
      {successCelebration && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 text-center space-y-4 animate-[zoomIn_0.2s_ease-out]">
            <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto text-2xl shadow-inner">
              🎉
            </div>

            <div>
              <span className="text-xs font-bold text-amber-600 tracking-wider uppercase font-mono">
                XÁC THỰC TEM CHÍNH HÃNG THÀNH CÔNG!
              </span>
              <h3 className="text-3xl font-black text-slate-900 font-mono mt-1">
                +{successCelebration.points} PTS
              </h3>
              <p className="text-xs text-slate-600 mt-1">
                Đã cộng điểm thưởng từ <strong>{successCelebration.productTitle}</strong> vào thẻ của{' '}
                <strong>{activeMechanic.name}</strong>.
              </p>
            </div>

            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 font-medium">
              Số dư điểm mới: <strong>{(currentPoints + successCelebration.points).toLocaleString()} PTS</strong>
            </div>

            <button
              onClick={() => setSuccessCelebration(null)}
              className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-xs cursor-pointer"
            >
              Tiếp Tục Quét Mã
            </button>
          </div>
        </div>
      )}

      {/* Claim Reward Barcode Modal */}
      {rewardClaimModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h4 className="font-bold text-slate-900 text-base">
                  Phiếu Đổi Quà Thợ Máy
                </h4>
                <p className="text-xs text-slate-500">Mã voucher xác thực bàn giao trực tiếp</p>
              </div>
              <button onClick={() => setRewardClaimModal(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-center space-y-2">
              <div className="text-3xl">{rewardClaimModal.icon}</div>
              <div className="font-bold text-slate-900 text-sm">{rewardClaimModal.name}</div>
              <div className="text-xs text-slate-500 font-mono">
                Khấu trừ: <strong>{rewardClaimModal.requiredPoints} PTS</strong> từ tài khoản {activeMechanic.name}
              </div>

              {/* Barcode representation */}
              <div className="pt-3 border-t border-slate-200">
                <div className="font-mono text-xl font-black tracking-widest text-slate-800">
                  ||| | | || ||| | ||| |||| |
                </div>
                <div className="text-xs font-mono text-slate-500 font-bold tracking-wider mt-1">
                  RW-2026-{activeMechanic.id}-{(Math.random() * 1000).toFixed(0)}
                </div>
              </div>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed text-center">
              Nhân viên Sales thị trường khi viếng thăm điểm bán sẽ quét mã này để trao vật phẩm tận tay.
            </p>

            <button
              onClick={() => {
                onAddLoyaltyPoints(activeMechanic.id, -rewardClaimModal.requiredPoints);
                soundFX.playSuccess();
                setRewardClaimModal(null);
              }}
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs cursor-pointer"
            >
              Xác Nhận Đã Trao Quà &amp; Khấu Trừ Điểm
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
