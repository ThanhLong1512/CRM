"use client";
import { MapPin, ShoppingBag, QrCode, Truck } from 'lucide-react';
import { soundFX } from '../../utils/audio';

export type PwaTab = 'route' | 'catalog' | 'loyalty' | 'fleet';

interface PwaBottomNavProps {
  activeTab: PwaTab;
  onChangeTab: (tab: PwaTab) => void;
  cartItemCount: number;
  urgentFleetCount: number;
}

export default function PwaBottomNav({
  activeTab,
  onChangeTab,
  cartItemCount,
  urgentFleetCount,
}: PwaBottomNavProps) {
  const handleTabClick = (tab: PwaTab) => {
    if (tab !== activeTab) {
      soundFX.playClick();
      if (typeof window !== 'undefined' && 'vibrate' in navigator) {
        try {
          navigator.vibrate(25);
        } catch {}
      }
      onChangeTab(tab);
    }
  };

  const navItems = [
    {
      id: 'route' as PwaTab,
      label: 'Lộ trình',
      icon: MapPin,
      badge: undefined,
      badgeColor: '',
    },
    {
      id: 'catalog' as PwaTab,
      label: 'Đặt hàng',
      icon: ShoppingBag,
      badge: cartItemCount > 0 ? cartItemCount : undefined,
      badgeColor: 'bg-amber-500 text-slate-950',
    },
    {
      id: 'loyalty' as PwaTab,
      label: 'Tích điểm',
      icon: QrCode,
      badge: undefined,
      badgeColor: '',
    },
    {
      id: 'fleet' as PwaTab,
      label: 'Đội xe',
      icon: Truck,
      badge: urgentFleetCount > 0 ? urgentFleetCount : undefined,
      badgeColor: 'bg-rose-500 text-white animate-pulse',
    },
  ];

  return (
    <nav
      id="pwa-bottom-navigation"
      className="fixed bottom-0 left-0 right-0 z-40 bg-slate-900 border-t border-slate-800 shadow-2xl select-none"
      style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 6px)' }}
    >
      <div className="h-[68px] max-w-lg mx-auto px-2 grid grid-cols-4 items-center">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              id={`pwa-tab-${item.id}`}
              onClick={() => handleTabClick(item.id)}
              className={`h-12 min-h-[48px] rounded-2xl flex flex-col items-center justify-center relative transition-all duration-200 cursor-pointer ${
                isActive
                  ? 'text-amber-400 font-bold scale-102'
                  : 'text-slate-400 hover:text-slate-200 font-medium'
              }`}
            >
              {/* Active Tab Ambient Pill Glow */}
              {isActive && (
                <span className="absolute inset-x-2 inset-y-1 bg-amber-500/15 rounded-xl -z-10 border border-amber-500/25 transition-all" />
              )}

              {/* Icon with optional badge */}
              <div className="relative">
                <Icon
                  className={`w-5 h-5 transition-transform duration-200 ${
                    isActive ? 'scale-110 stroke-[2.5]' : 'stroke-2'
                  }`}
                />
                {item.badge !== undefined && (
                  <span
                    className={`absolute -top-1.5 -right-3 min-w-4 h-4 px-1 rounded-full text-[10px] font-black font-mono flex items-center justify-center leading-none ${item.badgeColor}`}
                  >
                    {item.badge}
                  </span>
                )}
              </div>

              {/* Label */}
              <span className="text-[11px] mt-0.5 tracking-tight">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
