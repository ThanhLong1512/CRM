import { useState } from 'react';
import { Product } from '../../types';
import { formatVND } from '../../mockData';
import { soundFX } from '../../utils/audio';
import { X, Delete, Check } from 'lucide-react';

interface PwaNumpadDrawerProps {
  product: Product;
  currentQty: number;
  unitPrice: number;
  onConfirm: (quantity: number) => void;
  onClose: () => void;
}

export default function PwaNumpadDrawer({
  product,
  currentQty,
  unitPrice,
  onConfirm,
  onClose,
}: PwaNumpadDrawerProps) {
  const [valStr, setValStr] = useState<string>(currentQty > 0 ? String(currentQty) : '1');

  const triggerHaptic = () => {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(15);
      } catch {}
    }
    soundFX.playClick();
  };

  const handlePressKey = (char: string) => {
    triggerHaptic();
    if (char === 'C') {
      setValStr('0');
      return;
    }
    if (char === 'DEL') {
      setValStr((prev) => (prev.length > 1 ? prev.slice(0, -1) : '0'));
      return;
    }

    setValStr((prev) => {
      if (prev === '0') return char;
      if (prev.length >= 4) return prev; // max 9999
      return prev + char;
    });
  };

  const handleQuickAdd = (amount: number) => {
    triggerHaptic();
    setValStr(String(Math.min(9999, Math.max(1, (Number(valStr) || 0) + amount))));
  };

  const handleConfirm = () => {
    soundFX.playSuccess();
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(30);
      } catch {}
    }
    onConfirm(Math.max(0, Number(valStr) || 0));
  };

  const numericQty = Math.max(0, Number(valStr) || 0);
  const totalAmount = numericQty * unitPrice;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end bg-slate-950/70 backdrop-blur-xs select-none">
      {/* Backdrop Click Dismiss */}
      <div className="flex-1" onClick={onClose} />

      {/* Drawer Body */}
      <div className="bg-white rounded-t-3xl border-t border-slate-200 shadow-2xl p-4 max-w-lg mx-auto w-full space-y-4 animate-in slide-in-from-bottom duration-200">
        {/* Top Drag Handle */}
        <div className="flex justify-center">
          <div className="w-12 h-1.5 bg-slate-300 rounded-full" />
        </div>

        {/* Product Info Header */}
        <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3">
          <div className="min-w-0">
            <div className="text-[10px] font-bold text-amber-600 uppercase font-mono">
              Nhập Số Lượng Nhanh ({product.packageType})
            </div>
            <h4 className="text-sm font-bold text-slate-900 truncate">{product.name}</h4>
            <div className="text-xs text-slate-500 mt-0.5">
              Đơn giá: <strong className="font-mono text-slate-700">{formatVND(unitPrice)}</strong>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:text-slate-800 flex items-center justify-center cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Quantity Display Box */}
        <div className="bg-slate-900 text-white rounded-2xl p-3.5 flex items-center justify-between shadow-inner">
          <div>
            <div className="text-[10px] font-semibold text-slate-400 uppercase">
              Số lượng đặt ({product.unit}):
            </div>
            <div className="text-3xl font-black font-mono text-amber-400 tracking-tight">
              {numericQty}
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] font-semibold text-slate-400 uppercase">Thành tiền:</div>
            <div className="text-base font-bold font-mono text-white">
              {formatVND(totalAmount)}
            </div>
          </div>
        </div>

        {/* Quick Batch Increment Buttons (+5, +10, +20, +50) */}
        <div className="grid grid-cols-4 gap-2">
          {[5, 10, 20, 50].map((step) => (
            <button
              key={step}
              onClick={() => handleQuickAdd(step)}
              className="h-10 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 text-xs font-bold font-mono active:scale-95 transition-transform cursor-pointer"
            >
              +{step} {product.packageType.includes('Phuy') ? 'phuy' : 'thùng'}
            </button>
          ))}
        </div>

        {/* Tactile 3x4 Numpad */}
        <div className="grid grid-cols-3 gap-2">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', 'DEL'].map((k) => (
            <button
              key={k}
              onClick={() => handlePressKey(k)}
              className={`h-12 min-h-[48px] rounded-xl font-bold font-mono text-lg flex items-center justify-center shadow-xs active:scale-95 transition-transform cursor-pointer ${
                k === 'C'
                  ? 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                  : k === 'DEL'
                  ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-900'
              }`}
            >
              {k === 'DEL' ? <Delete className="w-5 h-5" /> : k}
            </button>
          ))}
        </div>

        {/* Confirm Button */}
        <button
          onClick={handleConfirm}
          className="w-full h-12 min-h-[48px] rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-[0.98] text-slate-950 font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25 transition-all cursor-pointer font-mono"
        >
          <Check className="w-4 h-4" />
          <span>XÁC NHẬN SỐ LƯỢNG ({numericQty} &bull; {formatVND(totalAmount)})</span>
        </button>
      </div>
    </div>
  );
}
