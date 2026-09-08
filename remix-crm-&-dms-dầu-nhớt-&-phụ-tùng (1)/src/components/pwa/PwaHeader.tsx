import { CloudOff, Wifi, RefreshCw, Smartphone, Maximize2, LayoutDashboard } from 'lucide-react';

interface PwaHeaderProps {
  activeRouteName: string;
  isOffline: boolean;
  onToggleOffline: () => void;
  pendingQueueCount: number;
  onQuickSync: () => void;
  isSyncing: boolean;
  isMobileFrame: boolean;
  onToggleMobileFrame: () => void;
  onOpenAdminDashboard?: () => void;
}

export default function PwaHeader({
  activeRouteName,
  isOffline,
  onToggleOffline,
  pendingQueueCount,
  onQuickSync,
  isSyncing,
  isMobileFrame,
  onToggleMobileFrame,
  onOpenAdminDashboard,
}: PwaHeaderProps) {
  return (
    <header
      id="pwa-top-header"
      className="fixed top-0 left-0 right-0 h-14 bg-slate-900 text-white z-40 px-3.5 flex items-center justify-between border-b border-slate-800 shadow-md select-none"
    >
      {/* Left: Active Sales Route Indicator */}
      <div className="flex items-center gap-2 min-w-0">
        <div className="w-8 h-8 rounded-xl bg-amber-500 text-slate-950 font-black text-xs flex items-center justify-center font-mono shrink-0 shadow-xs">
          DMS
        </div>
        <div className="min-w-0">
          <div className="text-[10px] text-amber-400/90 font-bold uppercase tracking-wider font-mono">
            Tuyến Bán Hàng
          </div>
          <div className="text-xs font-bold text-slate-100 truncate max-w-[150px] sm:max-w-[200px]">
            {activeRouteName || 'Tuyến Tân Bình - Thứ 3'}
          </div>
        </div>
      </div>

      {/* Center & Right Controls */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Dynamic Connectivity Badge (One-touch toggle for testing) */}
        <button
          id="pwa-connectivity-toggle"
          onClick={onToggleOffline}
          className={`h-9 px-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer border ${
            isOffline
              ? 'bg-amber-500/20 text-amber-400 border-amber-500/40 hover:bg-amber-500/30'
              : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/25'
          }`}
          title="Nhấn để chuyển đổi chế độ Trực tuyến / Ngoại tuyến (Offline-First)"
        >
          {isOffline ? (
            <>
              <CloudOff className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-[11px] font-mono">Ngoại tuyến</span>
            </>
          ) : (
            <>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <Wifi className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-[11px] font-mono">Online 4G</span>
            </>
          )}
        </button>

        {/* Quick Sync Pill Trigger if pending queue exists */}
        {pendingQueueCount > 0 && (
          <button
            id="pwa-quick-sync-btn"
            onClick={onQuickSync}
            disabled={isSyncing}
            className="h-9 px-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer font-mono"
            title="Đồng bộ ngay đơn hàng chờ trong máy lên hệ thống"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>Sync ({pendingQueueCount})</span>
          </button>
        )}

        {/* Viewport Frame Toggle (Phone frame vs full width view) */}
        <button
          onClick={onToggleMobileFrame}
          className="h-9 w-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors cursor-pointer border border-slate-700"
          title={isMobileFrame ? 'Chuyển sang Toàn màn hình' : 'Chuyển sang Khung nhìn Smartphone 390px'}
        >
          {isMobileFrame ? (
            <Maximize2 className="w-4 h-4 text-amber-400" />
          ) : (
            <Smartphone className="w-4 h-4 text-slate-300" />
          )}
        </button>

        {/* Switch to Desktop Admin Portal */}
        {onOpenAdminDashboard && (
          <button
            onClick={onOpenAdminDashboard}
            className="h-9 px-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-700 font-mono"
            title="Chuyển sang Giao diện Quản trị DMS (Dashboard/Kho/Công Nợ)"
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Admin DMS</span>
          </button>
        )}
      </div>
    </header>
  );
}
