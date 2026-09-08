'use client';

import dynamic from 'next/dynamic';
import { Fuel, RefreshCw } from 'lucide-react';

// Dynamic import with SSR disabled to guarantee zero hydration discrepancy on browser APIs (localStorage, AudioContext, Leaflet)
const AppContent = dynamic(() => import('../../src/App'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen w-full bg-slate-950 flex flex-col items-center justify-center p-6 text-white font-sans">
      <div className="w-16 h-16 rounded-3xl bg-amber-500 text-slate-950 flex items-center justify-center shadow-2xl shadow-amber-500/20 mb-4 animate-bounce">
        <Fuel className="w-8 h-8" />
      </div>
      <h2 className="text-xl font-black tracking-tight text-white font-display">
        REMIX LUBRICANTS CRM &amp; DMS
      </h2>
      <p className="text-xs text-amber-400 font-mono mt-1 font-bold">
        Next.js App Router Edition
      </p>
      <div className="flex items-center gap-2 mt-6 text-slate-400 text-xs">
        <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
        <span>Đang nạp hệ thống phân phối &amp; dữ liệu kho...</span>
      </div>
    </div>
  ),
});

export default function HomePage() {
  return <AppContent />;
}
