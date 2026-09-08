"use client";
import { useState, useEffect, useRef } from 'react';
import { Customer } from '../../types';
import { calculateHaversineDistance, formatVND } from '../../mockData';
import { soundFX } from '../../utils/audio';
import {
  MapPin,
  Navigation,
  CheckCircle2,
  ExternalLink,
  Compass,
  LocateFixed,
  AlertCircle,
  Building2,
  Truck,
  Wrench,
  ArrowRight,
  Sliders,
  Phone,
  Package,
  CreditCard,
  ShieldCheck,
  Clock,
} from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface PwaRouteMapProps {
  customers: Customer[];
  activeCustomer: Customer;
  onSelectCustomer: (customer: Customer) => void;
  onCheckInSuccess: (customer: Customer, checkInData: { timestamp: string; lat: number; lng: number; accuracyMeters: number }) => void;
  checkedInCustomerIds: Set<string>;
  onNavigateToCatalog: () => void;
}

export default function PwaRouteMap({
  customers,
  activeCustomer,
  onSelectCustomer,
  onCheckInSuccess,
  checkedInCustomerIds,
  onNavigateToCatalog,
}: PwaRouteMapProps) {
  // Geofence simulated or actual distance
  const [distanceMeters, setDistanceMeters] = useState<number>(28); // Default in-range 28m
  const [isSimulatingGps, setIsSimulatingGps] = useState<boolean>(true);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number }>({
    lat: activeCustomer.lat + 0.0002,
    lng: activeCustomer.lng + 0.0001,
  });

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.LayerGroup | null>(null);
  const userMarkerRef = useRef<L.CircleMarker | null>(null);
  const userAccuracyCircleRef = useRef<L.Circle | null>(null);

  const isCheckedIn = checkedInCustomerIds.has(activeCustomer.id);
  const isInRange = distanceMeters <= 50;

  // Initialize or update Leaflet map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!leafletMapRef.current) {
      // Create map instance
      const map = L.map(mapContainerRef.current, {
        center: [activeCustomer.lat, activeCustomer.lng],
        zoom: 16,
        zoomControl: false,
        attributionControl: false,
      });

      // CartoDB Positron clean light tiles
      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        maxZoom: 19,
        subdomains: 'abcd',
      }).addTo(map);

      // Markers layer
      const markerGroup = L.layerGroup().addTo(map);
      markersRef.current = markerGroup;

      leafletMapRef.current = map;
    }

    const map = leafletMapRef.current;
    if (!map) return;

    // Pan to active customer
    map.flyTo([activeCustomer.lat, activeCustomer.lng], 16, { duration: 0.8 });

    // Render customer pins
    if (markersRef.current) {
      markersRef.current.clearLayers();

      customers.forEach((cust) => {
        const isCustCheckedIn = checkedInCustomerIds.has(cust.id);
        const isSelected = cust.id === activeCustomer.id;
        const isPriority = cust.rfmSegment === 'At Risk' || (cust.lastPurchaseDaysAgo ?? 0) >= 20;

        let pinBg = '#64748B'; // Slate (scheduled)
        if (isCustCheckedIn) {
          pinBg = '#059669'; // Emerald
        } else if (isPriority) {
          pinBg = '#D97706'; // Amber glow
        }

        const iconHtml = `
          <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 36px; height: 36px;">
            ${isSelected ? `<div style="position: absolute; width: 44px; height: 44px; border-radius: 9999px; background: ${pinBg}33; animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>` : ''}
            <div style="background: ${pinBg}; width: 32px; height: 32px; border-radius: 9999px; display: flex; align-items: center; justify-content: center; border: 2.5px solid #FFFFFF; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.25); color: #FFF; font-weight: 800; font-size: 11px;">
              ${cust.type === 'Thợ' ? '🔧' : cust.type === 'Đội xe' ? '🚛' : '🏢'}
            </div>
          </div>
        `;

        const customIcon = L.divIcon({
          className: 'custom-leaflet-pin',
          html: iconHtml,
          iconSize: [36, 36],
          iconAnchor: [18, 18],
        });

        const marker = L.marker([cust.lat, cust.lng], { icon: customIcon });
        marker.on('click', () => {
          onSelectCustomer(cust);
        });
        marker.addTo(markersRef.current!);
      });
    }

    // User Blue Beacon
    if (userMarkerRef.current) {
      userMarkerRef.current.setLatLng([userLocation.lat, userLocation.lng]);
    } else {
      userMarkerRef.current = L.circleMarker([userLocation.lat, userLocation.lng], {
        radius: 7,
        fillColor: '#2563EB',
        color: '#FFFFFF',
        weight: 3,
        opacity: 1,
        fillOpacity: 1,
      }).addTo(map);
    }

    // Accuracy Circle
    if (userAccuracyCircleRef.current) {
      userAccuracyCircleRef.current.setLatLng([userLocation.lat, userLocation.lng]);
      userAccuracyCircleRef.current.setRadius(Math.max(15, distanceMeters));
    } else {
      userAccuracyCircleRef.current = L.circle([userLocation.lat, userLocation.lng], {
        radius: Math.max(15, distanceMeters),
        color: '#3B82F6',
        weight: 1,
        fillColor: '#3B82F6',
        fillOpacity: 0.15,
      }).addTo(map);
    }
  }, [activeCustomer, customers, checkedInCustomerIds, userLocation, distanceMeters, onSelectCustomer]);

  // Invalidate map size on mount and container changes
  useEffect(() => {
    const timer = setTimeout(() => {
      leafletMapRef.current?.invalidateSize();
    }, 250);
    return () => clearTimeout(timer);
  }, []);

  // Request real device GPS
  const handleRequestRealGps = () => {
    if (!navigator.geolocation) {
      setGpsError('Trình duyệt không hỗ trợ Geolocation');
      return;
    }

    setIsLocating(true);
    setGpsError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIsLocating(false);
        const { latitude, longitude } = position.coords;
        setUserLocation({ lat: latitude, lng: longitude });

        // Calculate real distance to active customer
        const dist = calculateHaversineDistance(
          latitude,
          longitude,
          activeCustomer.lat,
          activeCustomer.lng
        );
        setDistanceMeters(dist);
        setIsSimulatingGps(false);
      },
      (err) => {
        setIsLocating(false);
        setGpsError('Không lấy được GPS (Dùng chế độ mô phỏng thanh trượt)');
        console.warn('GPS error:', err);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  // Perform Tactile Check-In
  const handleCheckIn = () => {
    if (!isInRange) return;

    // Haptic feedback
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate([100, 50, 100]);
      } catch {}
    }
    soundFX.playSuccess();

    const now = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    onCheckInSuccess(activeCustomer, {
      timestamp: now,
      lat: userLocation.lat,
      lng: userLocation.lng,
      accuracyMeters: distanceMeters,
    });
  };

  // Deep link to maps
  const openExternalNavigation = (cust: Customer) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${cust.lat},${cust.lng}`;
    window.open(url, '_blank');
  };

  const debtUsagePercent = Math.round((activeCustomer.currentDebt / (activeCustomer.creditLimit || 1)) * 100);

  return (
    <div id="pwa-route-module" className="w-full flex flex-col space-y-6">
      {/* 2-Column Responsive Grid Layout on lg (Desktop & Tablet) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full items-start">
        {/* Left Column (7 cols): Map Canvas & Route Points Grid */}
        <div className="lg:col-span-7 xl:col-span-8 flex flex-col space-y-4">
          {/* Top Map Canvas (Full width of the left column) */}
          <div className="relative w-full h-[380px] sm:h-[440px] lg:h-[480px] bg-slate-200 rounded-2xl border border-slate-300 overflow-hidden shadow-xs shrink-0">
            <div ref={mapContainerRef} className="w-full h-full z-0" />

            {/* Floating Map Controls */}
            <div className="absolute top-3 right-3 z-10 flex flex-col gap-2">
              {/* Real GPS locator button */}
              <button
                onClick={handleRequestRealGps}
                disabled={isLocating}
                className="w-10 h-10 rounded-xl bg-white/95 backdrop-blur-xs text-slate-800 shadow-md border border-slate-200 flex items-center justify-center active:scale-95 transition-all cursor-pointer"
                title="Lấy tọa độ GPS thực tế từ điện thoại"
              >
                <LocateFixed className={`w-5 h-5 text-blue-600 ${isLocating ? 'animate-spin' : ''}`} />
              </button>

              {/* External Nav for current active customer */}
              <button
                onClick={() => openExternalNavigation(activeCustomer)}
                className="w-10 h-10 rounded-xl bg-white/95 backdrop-blur-xs text-slate-800 shadow-md border border-slate-200 flex items-center justify-center active:scale-95 transition-all cursor-pointer"
                title="Chỉ đường trên Google Maps"
              >
                <Navigation className="w-5 h-5 text-amber-600" />
              </button>
            </div>

            {/* Top-left Radar Status Badge */}
            <div className="absolute top-3 left-3 z-10 bg-slate-900/90 backdrop-blur-md text-white px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2.5 shadow-md border border-slate-700">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-400 animate-ping" />
              <span className="font-mono text-xs sm:text-sm tracking-wide">GPS Geofence Radar 50m</span>
            </div>

            {gpsError && (
              <div className="absolute bottom-3 inset-x-3 z-10 bg-amber-500/95 text-slate-950 text-xs sm:text-sm px-4 py-2 rounded-xl font-bold flex items-center gap-2 shadow-md">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span className="truncate">{gpsError}</span>
              </div>
            )}
          </div>

          {/* Today's Route Stops Header & Multicolumn Grid */}
          <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2.5">
                <MapPin className="w-5 h-5 text-amber-500 shrink-0" />
                <h3 className="text-base sm:text-lg lg:text-xl font-black text-slate-900 tracking-tight">
                  Điểm Bán Trong Tuyến Hôm Nay ({customers.length})
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm font-mono font-bold px-3 py-1 rounded-full bg-emerald-100 text-emerald-800">
                  Đã ghé: {customers.filter((c) => checkedInCustomerIds.has(c.id)).length}/{customers.length}
                </span>
              </div>
            </div>

            {/* Multi-Column Grid of Route Stops */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3.5 pt-1">
              {customers.map((c) => {
                const isSelected = c.id === activeCustomer.id;
                const isCustCheckedIn = checkedInCustomerIds.has(c.id);

                return (
                  <button
                    key={c.id}
                    onClick={() => onSelectCustomer(c)}
                    className={`p-4 rounded-2xl border text-left transition-all duration-200 cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'bg-slate-900 text-white border-slate-900 shadow-lg ring-2 ring-amber-400'
                        : isCustCheckedIn
                        ? 'bg-emerald-50/70 text-slate-800 border-emerald-300 hover:border-emerald-400'
                        : 'bg-slate-50 hover:bg-white text-slate-800 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1.5 mb-2">
                        <span
                          className={`text-xs font-bold px-2.5 py-0.5 rounded-md font-mono uppercase tracking-wide ${
                            isSelected
                              ? 'bg-amber-500 text-slate-950'
                              : 'bg-slate-200 text-slate-700'
                          }`}
                        >
                          {c.type}
                        </span>
                        {isCustCheckedIn ? (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-500">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Đã ghé</span>
                          </span>
                        ) : (
                          <span className={`text-xs font-mono font-medium ${isSelected ? 'text-slate-400' : 'text-slate-500'}`}>
                            {c.code || c.id}
                          </span>
                        )}
                      </div>

                      <div className="font-extrabold text-sm sm:text-base leading-snug">
                        {c.name}
                      </div>
                      <div
                        className={`text-xs sm:text-sm truncate mt-1 ${
                          isSelected ? 'text-slate-300' : 'text-slate-500'
                        }`}
                      >
                        {c.address}
                      </div>
                    </div>

                    <div
                      className={`mt-3 pt-2.5 border-t text-xs sm:text-sm flex items-center justify-between ${
                        isSelected ? 'border-slate-800 text-slate-300' : 'border-slate-200 text-slate-600'
                      }`}
                    >
                      <span className="text-xs">Nợ hiện tại:</span>
                      <span className={`font-mono font-black ${isSelected ? 'text-amber-400' : 'text-amber-700'}`}>
                        {formatVND(c.currentDebt)}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column (5 cols): Active Customer Card & Check-In Action Module */}
        <div className="lg:col-span-5 xl:col-span-4 flex flex-col space-y-4">
          {/* Active Customer Focus Card (Hero scale typography) */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs sm:text-sm font-bold text-slate-400 font-mono">
                    {activeCustomer.code || activeCustomer.id}
                  </span>
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 font-mono">
                    {activeCustomer.type}
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 mt-1.5 leading-tight tracking-tight">
                  {activeCustomer.name}
                </h2>
                <p className="text-sm sm:text-base text-slate-600 mt-1.5 leading-normal flex items-start gap-1.5">
                  <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <span>{activeCustomer.address}</span>
                </p>
                {activeCustomer.phone && (
                  <p className="text-xs sm:text-sm text-slate-700 mt-1.5 flex items-center gap-1.5 font-mono font-medium">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{activeCustomer.phone}</span>
                  </p>
                )}
              </div>

              <button
                onClick={() => openExternalNavigation(activeCustomer)}
                className="h-10 px-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs sm:text-sm font-bold flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer"
                title="Mở Google Maps"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Chỉ đường</span>
              </button>
            </div>

            {/* Distance Metric & Geofence Status (Display scale for primary reading) */}
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between gap-3">
              <div>
                <div className="text-xs uppercase font-extrabold text-slate-400 tracking-wider">
                  Khoảng cách thực tế
                </div>
                <div
                  className={`text-3xl sm:text-4xl lg:text-5xl font-black font-mono mt-1 tracking-tight ${
                    isInRange ? 'text-emerald-600' : 'text-rose-600'
                  }`}
                >
                  {distanceMeters}m
                </div>
              </div>

              <div className="text-right">
                <div className="text-xs uppercase font-extrabold text-slate-400 tracking-wider">
                  Điều kiện Geofence
                </div>
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs sm:text-sm font-black mt-1 ${
                    isInRange
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  {isInRange ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Hợp lệ (&le; 50m)</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-4 h-4" />
                      <span>Quá xa (&gt; 50m)</span>
                    </>
                  )}
                </span>
              </div>
            </div>

            {/* GPS Simulation Slider (Essential for Instant Testing) */}
            <div className="pt-2 border-t border-slate-100 space-y-2">
              <div className="flex items-center justify-between text-xs sm:text-sm text-slate-700 font-bold">
                <span className="flex items-center gap-1.5">
                  <Sliders className="w-4 h-4 text-amber-500" />
                  <span>Mô phỏng khoảng cách GPS:</span>
                </span>
                <span className="font-mono font-black text-slate-900 bg-amber-100 text-amber-950 px-2.5 py-0.5 rounded-md text-sm">
                  {distanceMeters}m
                </span>
              </div>
              <input
                type="range"
                min="5"
                max="200"
                step="5"
                value={distanceMeters}
                onChange={(e) => setDistanceMeters(Number(e.target.value))}
                className="w-full h-3 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
              <div className="flex justify-between text-xs text-slate-500 font-mono font-medium">
                <span className="text-emerald-700 font-bold">5m (Trước cửa)</span>
                <span className="text-amber-700 font-bold">50m (Ngưỡng Geofence)</span>
                <span>200m (Cách xa)</span>
              </div>
            </div>

            {/* The Tactile Check-In Action Button */}
            <div className="pt-2">
              {isCheckedIn ? (
                <div className="space-y-3">
                  <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-sm text-emerald-900 font-bold">
                    <div className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                      <span>Đã Check-in tại {activeCustomer.name}</span>
                    </div>
                    <span className="font-mono text-emerald-700 text-xs font-bold">&plusmn;{distanceMeters}m</span>
                  </div>

                  <button
                    id="pwa-go-to-catalog-btn"
                    onClick={onNavigateToCatalog}
                    className="w-full h-14 rounded-2xl bg-amber-500 hover:bg-amber-400 active:scale-[0.98] text-slate-950 font-black text-base sm:text-lg flex items-center justify-center gap-2.5 shadow-lg shadow-amber-500/25 transition-all cursor-pointer"
                  >
                    <span>BẮT ĐẦU LÊN ĐƠN HÀNG NGAY</span>
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              ) : isInRange ? (
                <button
                  id="pwa-checkin-action-btn"
                  onClick={handleCheckIn}
                  className="w-full h-16 rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 active:scale-[0.98] text-white font-black text-base sm:text-lg flex flex-col items-center justify-center shadow-lg shadow-emerald-600/30 transition-all cursor-pointer animate-pulse"
                >
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-white" />
                    <span>CHECK-IN ĐIỂM BÁN (CÁCH {distanceMeters}M)</span>
                  </div>
                  <span className="text-xs text-emerald-100 font-normal tracking-wide">
                    Đã vào đúng bán kính Geofence &bull; Nhấn để mở khóa lên đơn
                  </span>
                </button>
              ) : (
                <div className="w-full p-4 sm:p-5 rounded-2xl bg-slate-100 text-slate-500 flex flex-col items-center justify-center text-center cursor-not-allowed border border-slate-200">
                  <div className="font-extrabold text-sm sm:text-base text-slate-700">
                    Bạn đang ở cách điểm bán {distanceMeters}m
                  </div>
                  <div className="text-xs sm:text-sm text-slate-500 mt-1">
                    Kéo thanh trượt hoặc di chuyển lại gần &le; 50m để mở khóa check-in
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Customer Financial & Drum Summary Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3.5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="text-sm sm:text-base font-black text-slate-900 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-amber-500" />
                <span>Hạn Mức &amp; Tài Sản Vỏ Phuy</span>
              </span>
              <span className="text-xs font-mono font-semibold text-slate-400">Sức khỏe tín dụng</span>
            </div>

            {/* Debt Usage Gauge */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs sm:text-sm text-slate-600 font-medium">
                <span>Công nợ đã sử dụng:</span>
                <span className="font-mono font-black text-slate-900 text-sm sm:text-base">
                  {formatVND(activeCustomer.currentDebt)} / {formatVND(activeCustomer.creditLimit)}
                </span>
              </div>
              <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className={`h-full transition-all ${
                    debtUsagePercent >= 85
                      ? 'bg-rose-500'
                      : debtUsagePercent >= 60
                      ? 'bg-amber-500'
                      : 'bg-emerald-500'
                  }`}
                  style={{ width: `${Math.min(100, debtUsagePercent)}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-slate-500 font-mono mt-1">
                <span className="font-bold">Tỷ lệ nợ: {debtUsagePercent}%</span>
                <span>Khả dụng: <strong className="text-emerald-700">{formatVND(Math.max(0, activeCustomer.creditLimit - activeCustomer.currentDebt))}</strong></span>
              </div>
            </div>

            {/* Empty Drums */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Package className="w-5 h-5 text-cyan-600" />
                <span className="text-xs sm:text-sm font-bold text-slate-700">Vỏ phuy 200L đang lưu giữ:</span>
              </div>
              <span className="font-mono font-black text-lg sm:text-xl text-cyan-700">
                {activeCustomer.emptyDrums || 0} vỏ
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
