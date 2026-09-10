"use client";
import { useState, useMemo } from 'react';
import { Vehicle, Product, Customer } from '../../types';
import { formatVND } from '@/lib/remix/mappers';
import { soundFX } from '../../utils/audio';
import {
  Truck,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  ShoppingCart,
  ArrowRight,
  Gauge,
  Droplet,
  Fuel,
} from 'lucide-react';

interface PwaFleetMaintenanceProps {
  vehicles: Vehicle[];
  products: Product[];
  activeCustomer: Customer;
  onQuickOrderForVehicle: (vehicle: Vehicle, product: Product, quantity: number) => void;
}

export default function PwaFleetMaintenance({
  vehicles,
  products,
  activeCustomer,
  onQuickOrderForVehicle,
}: PwaFleetMaintenanceProps) {
  const [filterStatus, setFilterStatus] = useState<'all' | 'Đỏ' | 'Vàng' | 'Xanh'>('all');

  // Count summaries
  const redCount = vehicles.filter((v) => v.status === 'Đỏ').length;
  const yellowCount = vehicles.filter((v) => v.status === 'Vàng').length;
  const greenCount = vehicles.filter((v) => v.status === 'Xanh').length;

  const filteredVehicles = useMemo(() => {
    if (filterStatus === 'all') return vehicles;
    return vehicles.filter((v) => v.status === filterStatus);
  }, [vehicles, filterStatus]);

  // Map vehicle recommended oil to actual product
  const getProductForVehicle = (vehicle: Vehicle): { product: Product; quantity: number } => {
    // Look for 15W-40 pail or drum
    const pail18L = products.find((p) => p.packageType === 'Thùng 18L' && p.viscosity.includes('15W-40')) || products[1] || products[0];
    const drum200L = products.find((p) => p.packageType === 'Phuy 200L') || products[0];

    const capacity = vehicle.oilCapacityLiters ?? 18;
    if (capacity >= 36) {
      // 2 x 18L
      return { product: pail18L, quantity: Math.ceil(capacity / 18) };
    }
    // 1 x 18L
    return { product: pail18L, quantity: 1 };
  };

  const handle1TapQuickOrder = (vehicle: Vehicle) => {
    const { product, quantity } = getProductForVehicle(vehicle);

    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate([80, 40, 80]);
      } catch {}
    }
    soundFX.playSuccess();
    onQuickOrderForVehicle(vehicle, product, quantity);
  };

  return (
    <div id="pwa-fleet-module" className="flex flex-col h-full bg-slate-50 select-none pb-28">
      <div className="p-4 max-w-lg mx-auto w-full space-y-4">
        {/* Header Title */}
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold text-amber-600 uppercase font-mono tracking-wider">
              Theo Dõi Chu Kỳ Nhớt Đội Xe
            </div>
            <h3 className="text-base font-black text-slate-900 leading-tight">
              Đội Xe & Dự Báo Thay Nhớt
            </h3>
          </div>
          <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-slate-200 text-slate-700">
            {vehicles.length} Phương tiện
          </span>
        </div>

        {/* Section 1: Top 3 Summary Pills */}
        <div className="grid grid-cols-3 gap-2">
          {/* Red Overdue */}
          <button
            onClick={() => setFilterStatus(filterStatus === 'Đỏ' ? 'all' : 'Đỏ')}
            className={`p-2.5 rounded-2xl border text-center transition-all cursor-pointer ${
              filterStatus === 'Đỏ'
                ? 'bg-rose-600 text-white border-rose-600 shadow-md scale-102'
                : 'bg-rose-50 text-rose-950 border-rose-200 hover:bg-rose-100'
            }`}
          >
            <div className="flex items-center justify-center gap-1 text-[10px] font-bold uppercase tracking-tight">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
              <span>Quá hạn</span>
            </div>
            <div className="text-xl font-black font-mono mt-0.5">{redCount} Xe</div>
          </button>

          {/* Yellow Warning */}
          <button
            onClick={() => setFilterStatus(filterStatus === 'Vàng' ? 'all' : 'Vàng')}
            className={`p-2.5 rounded-2xl border text-center transition-all cursor-pointer ${
              filterStatus === 'Vàng'
                ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-md scale-102 font-bold'
                : 'bg-amber-50 text-amber-950 border-amber-200 hover:bg-amber-100'
            }`}
          >
            <div className="text-[10px] font-bold uppercase tracking-tight text-amber-800">
              Sắp đến hạn
            </div>
            <div className="text-xl font-black font-mono text-amber-900 mt-0.5">
              {yellowCount} Xe
            </div>
          </button>

          {/* Green Good */}
          <button
            onClick={() => setFilterStatus(filterStatus === 'Xanh' ? 'all' : 'Xanh')}
            className={`p-2.5 rounded-2xl border text-center transition-all cursor-pointer ${
              filterStatus === 'Xanh'
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-md scale-102'
                : 'bg-emerald-50 text-emerald-950 border-emerald-200 hover:bg-emerald-100'
            }`}
          >
            <div className="text-[10px] font-bold uppercase tracking-tight text-emerald-800">
              An toàn
            </div>
            <div className="text-xl font-black font-mono text-emerald-900 mt-0.5">
              {greenCount} Xe
            </div>
          </button>
        </div>

        {/* Section 2: Vehicle Cards List */}
        <div className="space-y-3">
          {filteredVehicles.map((vehicle) => {
            const { product, quantity } = getProductForVehicle(vehicle);
            const kmRemaining = vehicle.nextOilChangeKm - vehicle.currentKm;
            const isOverdue = vehicle.status === 'Đỏ';
            const isNearLimit = vehicle.status === 'Vàng';

            return (
              <div
                key={vehicle.id}
                id={`pwa-vehicle-card-${vehicle.id}`}
                className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-3"
              >
                {/* Top Row: Plate Badge, Type & Status Pill */}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      {/* Bold Monospace License Plate with Country Badge Style */}
                      <span className="font-mono font-black text-sm px-2.5 py-1 rounded-lg bg-slate-900 text-amber-400 border border-slate-700 tracking-wider shadow-2xs">
                        {vehicle.plate}
                      </span>
                      <span className="text-[10px] text-slate-500 font-medium truncate">
                        {vehicle.customerName}
                      </span>
                    </div>
                    <h4 className="font-bold text-xs text-slate-800 mt-1 leading-tight">
                      {vehicle.vehicleType}
                    </h4>
                  </div>

                  {/* Oil Health Badge */}
                  <div>
                    {isOverdue ? (
                      <span className="px-2.5 py-1 rounded-full bg-rose-100 text-rose-700 font-extrabold text-[10px] flex items-center gap-1 animate-pulse font-mono">
                        <AlertTriangle className="w-3 h-3 text-rose-600" />
                        <span>QUÁ HẠN {Math.abs(kmRemaining)}KM</span>
                      </span>
                    ) : isNearLimit ? (
                      <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 font-bold text-[10px] flex items-center gap-1 font-mono">
                        <AlertCircle className="w-3 h-3 text-amber-600" />
                        <span>CÒN {kmRemaining}KM</span>
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px] flex items-center gap-1 font-mono">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>AN TOÀN ({kmRemaining}KM)</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Middle Row: Odometer & 3-Zone Oil Degradation Visual Gauge */}
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-500 font-semibold flex items-center gap-1">
                      <Gauge className="w-3.5 h-3.5 text-slate-400" />
                      <span>Đồng hồ ODO:</span>
                    </span>
                    <span className="font-bold text-slate-900">
                      {vehicle.currentKm.toLocaleString('vi-VN')} / {vehicle.nextOilChangeKm.toLocaleString('vi-VN')} km
                    </span>
                  </div>

                  {/* 3-Zone Consumption Visual Bar */}
                  <div className="space-y-1">
                    <div className="h-2.5 w-full bg-slate-200 rounded-full overflow-hidden flex">
                      <div className="w-[60%] h-full bg-emerald-500" title="Vùng Xanh: 0 - 6.000km" />
                      <div className="w-[30%] h-full bg-amber-400" title="Vùng Vàng: 6.000 - 9.000km" />
                      <div className="w-[10%] h-full bg-rose-500" title="Vùng Đỏ: > 9.000km" />
                    </div>
                    <div className="flex justify-between text-[9px] text-slate-400 font-mono">
                      <span>0 km</span>
                      <span className="text-slate-600 font-bold">
                        Tuổi thọ dầu: {vehicle.oilLifePercent}%
                      </span>
                      <span>Chu kỳ 10.000 km</span>
                    </div>
                  </div>
                </div>

                {/* Bottom Row: Recommended Oil Product & 1-Tap Action Button */}
                <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200/80 space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-[10px] font-bold text-amber-800 uppercase font-mono flex items-center gap-1">
                        <Droplet className="w-3 h-3 text-amber-600" />
                        <span>Dầu Nhớt Khuyên Dùng:</span>
                      </div>
                      <div className="font-bold text-xs text-slate-900 mt-0.5">
                        {vehicle.recommendedOil}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        Dung tích carte: <strong className="font-mono text-slate-700">{vehicle.oilCapacityLiters} Lít</strong> &bull; Quy cách: {quantity} &times; {product.packageType}
                      </div>
                    </div>
                  </div>

                  {/* 1-Tap Action Button: LÊN ĐƠN NHANH CHO XE NÀY */}
                  <button
                    onClick={() => handle1TapQuickOrder(vehicle)}
                    className="w-full h-12 min-h-[48px] rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-[0.98] text-slate-950 font-extrabold text-xs flex items-center justify-center gap-2 shadow-md shadow-amber-500/20 transition-all cursor-pointer font-mono"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    <span>LÊN ĐƠN NHANH CHO XE NÀY (+{quantity} {product.packageType})</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
