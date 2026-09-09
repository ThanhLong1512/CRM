"use client";
import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Customer } from '../../types';
import { calculateHaversineDistance, formatVND } from '../../mockData';
import { CHECK_IN_MAX_DISTANCE_M } from '@/lib/geo';
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
  Camera,
  Image as ImageIcon,
  Trash2,
} from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const ALLOW_GPS_SIM = process.env.NODE_ENV === 'development';
const DEFAULT_MAP_CENTER: [number, number] = [10.7769, 106.7009];

interface PwaRouteMapProps {
  customers: Customer[];
  activeCustomer: Customer;
  onSelectCustomer: (customer: Customer) => void;
  onCheckInSuccess: (
    customer: Customer,
    checkInData: {
      timestamp: string;
      lat: number;
      lng: number;
      accuracyMeters: number;
      photoBase64?: string;
    },
  ) => void | Promise<void>;
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
  const [distanceMeters, setDistanceMeters] = useState<number | null>(null);
  const [isSimulatingGps, setIsSimulatingGps] = useState<boolean>(false);
  const [hasGpsFix, setHasGpsFix] = useState<boolean>(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState<boolean>(true);
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [checkInPhoto, setCheckInPhoto] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  const getTodayKey = (): 'T2' | 'T3' | 'T4' | 'T5' | 'T6' | 'T7' => {
    const day = new Date().getDay();
    if (day === 2) return 'T3';
    if (day === 3) return 'T4';
    if (day === 4) return 'T5';
    if (day === 5) return 'T6';
    if (day === 6) return 'T7';
    return 'T2';
  };

  const todayKey = getTodayKey();
  const [selectedDay, setSelectedDay] = useState<string>('today');

  const activeBeatDay = selectedDay === 'today' ? todayKey : selectedDay;
  const filteredBeatCustomers = useMemo(() => {
    if (selectedDay === 'all') return customers;
    return customers.filter((c: Customer) => c.visitDay === activeBeatDay);
  }, [customers, selectedDay, activeBeatDay]);

  const beatTotal = filteredBeatCustomers.length;
  const beatVisited = filteredBeatCustomers.filter((c: Customer) =>
    checkedInCustomerIds.has(c.id),
  ).length;
  const beatProgress =
    beatTotal === 0 ? 0 : Math.round((beatVisited / beatTotal) * 100);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.LayerGroup | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const geofenceCircleRef = useRef<L.Circle | null>(null);
  const connectionLineRef = useRef<L.Polyline | null>(null);

  const isCheckedIn = checkedInCustomerIds.has(activeCustomer.id);
  const needsGpsPin = !activeCustomer.hasGps;
  const isInRange = needsGpsPin
    ? hasGpsFix
    : hasGpsFix && distanceMeters != null && distanceMeters <= CHECK_IN_MAX_DISTANCE_M;

  const mapCenterLat = activeCustomer.hasGps
    ? activeCustomer.lat
    : DEFAULT_MAP_CENTER[0];
  const mapCenterLng = activeCustomer.hasGps
    ? activeCustomer.lng
    : DEFAULT_MAP_CENTER[1];

  // Request real device GPS
  const handleRequestRealGps = useCallback(() => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      setGpsError('Trình duyệt của bạn không hỗ trợ định vị Geolocation.');
      setIsLocating(false);
      return;
    }

    setIsLocating(true);
    setGpsError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIsLocating(false);
        const { latitude, longitude } = position.coords;
        setUserLocation({ lat: latitude, lng: longitude });
        setHasGpsFix(true);
        setIsSimulatingGps(false);

        if (activeCustomer.hasGps) {
          const dist = calculateHaversineDistance(
            latitude,
            longitude,
            activeCustomer.lat,
            activeCustomer.lng,
          );
          setDistanceMeters(Math.round(dist));
        } else {
          setDistanceMeters(0);
        }
      },
      (err) => {
        setIsLocating(false);
        if (err.code === 1) {
          setGpsError('Chưa cấp quyền vị trí. Vui lòng bấm vào biểu tượng ổ khóa cạnh thanh địa chỉ URL và chọn "Cho phép" vị trí.');
        } else if (err.code === 2) {
          setGpsError('Không thể xác định vị trí GPS từ thiết bị.');
        } else if (err.code === 3) {
          setGpsError('Hết thời gian chờ định vị GPS. Vui lòng bấm thử lại.');
        } else {
          setGpsError(err.message || 'Không lấy được GPS từ thiết bị.');
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 5000,
      },
    );
  }, [activeCustomer]);

  // Request real GPS automatically on initial mount & watch position continuously
  useEffect(() => {
    handleRequestRealGps();

    if (typeof window !== 'undefined' && navigator.geolocation) {
      const watchId = navigator.geolocation.watchPosition(
        (pos) => {
          if (!isSimulatingGps) {
            const { latitude, longitude } = pos.coords;
            setUserLocation({ lat: latitude, lng: longitude });
            setHasGpsFix(true);
            setIsLocating(false);
          }
        },
        () => {},
        { enableHighAccuracy: true, maximumAge: 10000, timeout: 20000 }
      );
      return () => {
        navigator.geolocation.clearWatch(watchId);
      };
    }
  }, [handleRequestRealGps, isSimulatingGps]);

  // When activeCustomer or userLocation changes, recalculate distance without altering userLocation
  useEffect(() => {
    if (userLocation && activeCustomer.hasGps && !isSimulatingGps) {
      const dist = calculateHaversineDistance(
        userLocation.lat,
        userLocation.lng,
        activeCustomer.lat,
        activeCustomer.lng,
      );
      setDistanceMeters(Math.round(dist));
    }
  }, [activeCustomer, userLocation, isSimulatingGps]);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!leafletMapRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [mapCenterLat, mapCenterLng],
        zoom: 16,
        zoomControl: false,
        attributionControl: false,
      });

      L.tileLayer('https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
        maxZoom: 20,
        subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
      }).addTo(map);

      const markerGroup = L.layerGroup().addTo(map);
      markersRef.current = markerGroup;

      leafletMapRef.current = map;
    }

    const map = leafletMapRef.current;
    if (!map) return;

    map.invalidateSize();
    map.flyTo([mapCenterLat, mapCenterLng], 16, { duration: 0.8 });
    setTimeout(() => {
      map.invalidateSize();
    }, 200);

    // Customer Markers
    if (markersRef.current) {
      markersRef.current.clearLayers();

      customers.forEach((cust) => {
        if (!cust.hasGps) return;

        const isCustCheckedIn = checkedInCustomerIds.has(cust.id);
        const isSelected = cust.id === activeCustomer.id;
        const isPriority =
          cust.rfmSegment === 'At Risk' || (cust.lastPurchaseDaysAgo ?? 0) >= 20;

        let pinBg = '#64748B';
        if (isCustCheckedIn) {
          pinBg = '#059669';
        } else if (isPriority) {
          pinBg = '#D97706';
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

    // Geofence Circle (200m) around Active Customer
    if (activeCustomer.hasGps) {
      const isWithinGeofence = hasGpsFix && distanceMeters != null && distanceMeters <= CHECK_IN_MAX_DISTANCE_M;
      if (geofenceCircleRef.current) {
        geofenceCircleRef.current.setLatLng([activeCustomer.lat, activeCustomer.lng]);
        geofenceCircleRef.current.setStyle({
          color: isWithinGeofence ? '#10B981' : '#F59E0B',
          fillColor: isWithinGeofence ? '#10B981' : '#F59E0B',
        });
      } else {
        geofenceCircleRef.current = L.circle([activeCustomer.lat, activeCustomer.lng], {
          radius: CHECK_IN_MAX_DISTANCE_M,
          color: isWithinGeofence ? '#10B981' : '#F59E0B',
          fillColor: isWithinGeofence ? '#10B981' : '#F59E0B',
          fillOpacity: 0.12,
          weight: 2,
          dashArray: isWithinGeofence ? undefined : '5, 5',
        }).addTo(map);
      }
    } else if (geofenceCircleRef.current) {
      geofenceCircleRef.current.remove();
      geofenceCircleRef.current = null;
    }

    // User Location Real Marker
    if (userLocation) {
      const userIcon = L.divIcon({
        className: 'user-real-location-marker',
        html: `
          <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 36px; height: 36px;">
            <div style="position: absolute; width: 36px; height: 36px; border-radius: 9999px; background: rgba(37, 99, 235, 0.35); animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
            <div style="background: #2563EB; width: 20px; height: 20px; border-radius: 9999px; border: 3px solid #FFFFFF; box-shadow: 0 3px 6px rgba(0,0,0,0.35); display: flex; align-items: center; justify-content: center;">
              <div style="width: 6px; height: 6px; border-radius: 9999px; background: #FFFFFF;"></div>
            </div>
          </div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      });

      if (userMarkerRef.current) {
        userMarkerRef.current.setLatLng([userLocation.lat, userLocation.lng]);
      } else {
        userMarkerRef.current = L.marker([userLocation.lat, userLocation.lng], {
          icon: userIcon,
          zIndexOffset: 1000,
        }).addTo(map);
        userMarkerRef.current.bindTooltip('Vị trí thực tế của bạn', {
          permanent: false,
          direction: 'top',
        });
      }

      // Connecting Dashed Line between User and Customer
      if (activeCustomer.hasGps) {
        if (connectionLineRef.current) {
          connectionLineRef.current.setLatLngs([
            [userLocation.lat, userLocation.lng],
            [activeCustomer.lat, activeCustomer.lng],
          ]);
        } else {
          connectionLineRef.current = L.polyline([
            [userLocation.lat, userLocation.lng],
            [activeCustomer.lat, activeCustomer.lng],
          ], {
            color: '#2563EB',
            weight: 2,
            opacity: 0.75,
            dashArray: '6, 8',
          }).addTo(map);
        }
      } else if (connectionLineRef.current) {
        connectionLineRef.current.remove();
        connectionLineRef.current = null;
      }
    } else {
      if (userMarkerRef.current) {
        userMarkerRef.current.remove();
        userMarkerRef.current = null;
      }
      if (connectionLineRef.current) {
        connectionLineRef.current.remove();
        connectionLineRef.current = null;
      }
    }
  }, [
    activeCustomer,
    customers,
    checkedInCustomerIds,
    userLocation,
    distanceMeters,
    hasGpsFix,
    onSelectCustomer,
    mapCenterLat,
    mapCenterLng,
  ]);

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setCheckInPhoto(base64);
      soundFX.playClick();
    };
    reader.readAsDataURL(file);
  };

  const handleCheckIn = async () => {
    if (!isInRange || isCheckingIn) return;

    setIsCheckingIn(true);
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate([100, 50, 100]);
      } catch {}
    }

    const now = new Date().toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
    });
    try {
      await onCheckInSuccess(activeCustomer, {
        timestamp: now,
        lat: userLocation ? userLocation.lat : activeCustomer.lat,
        lng: userLocation ? userLocation.lng : activeCustomer.lng,
        accuracyMeters: needsGpsPin ? 0 : (distanceMeters ?? 0),
        photoBase64: checkInPhoto || undefined,
      });
      soundFX.playSuccess();
    } finally {
      setIsCheckingIn(false);
    }
  };

  const openExternalNavigation = (cust: Customer) => {
    if (!cust.hasGps) {
      setGpsError('Khách hàng chưa có tọa độ GPS để chỉ đường.');
      return;
    }
    const originParam = userLocation ? `&origin=${userLocation.lat},${userLocation.lng}` : '';
    const url = `https://www.google.com/maps/dir/?api=1&destination=${cust.lat},${cust.lng}${originParam}`;
    window.open(url, '_blank');
  };

  const formatDistanceDisplay = (m: number | null): string => {
    if (m == null || !Number.isFinite(m)) return '—';
    if (m >= 1000) {
      return `${(m / 1000).toFixed(1)} km`;
    }
    return `${m}m`;
  };

  const debtUsagePercent = Math.round(
    (activeCustomer.currentDebt / (activeCustomer.creditLimit || 1)) * 100,
  );

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
              {/* Pan to User location */}
              <button
                type="button"
                onClick={() => {
                  if (userLocation && leafletMapRef.current) {
                    leafletMapRef.current.flyTo([userLocation.lat, userLocation.lng], 16, { duration: 0.8 });
                  } else {
                    handleRequestRealGps();
                  }
                }}
                disabled={isLocating}
                className="w-10 h-10 rounded-xl bg-white/95 backdrop-blur-xs text-slate-800 shadow-md border border-slate-200 flex items-center justify-center active:scale-95 transition-all cursor-pointer hover:bg-slate-50"
                title="Vị trí của tôi"
              >
                <LocateFixed className={`w-5 h-5 text-blue-600 ${isLocating ? 'animate-spin' : ''}`} />
              </button>

              {/* Pan to Customer location */}
              <button
                type="button"
                onClick={() => {
                  if (activeCustomer.hasGps && leafletMapRef.current) {
                    leafletMapRef.current.flyTo([activeCustomer.lat, activeCustomer.lng], 16, { duration: 0.8 });
                  }
                }}
                className="w-10 h-10 rounded-xl bg-white/95 backdrop-blur-xs text-slate-800 shadow-md border border-slate-200 flex items-center justify-center active:scale-95 transition-all cursor-pointer hover:bg-slate-50"
                title="Vị trí điểm bán"
              >
                <Building2 className="w-5 h-5 text-amber-600" />
              </button>

              {/* Fit bounds to see both */}
              {userLocation && activeCustomer.hasGps && (
                <button
                  type="button"
                  onClick={() => {
                    if (leafletMapRef.current && userLocation && activeCustomer.hasGps) {
                      const bounds = L.latLngBounds([
                        [userLocation.lat, userLocation.lng],
                        [activeCustomer.lat, activeCustomer.lng],
                      ]);
                      leafletMapRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
                    }
                  }}
                  className="w-10 h-10 rounded-xl bg-white/95 backdrop-blur-xs text-slate-800 shadow-md border border-slate-200 flex items-center justify-center active:scale-95 transition-all cursor-pointer hover:bg-slate-50"
                  title="Xem cả hai vị trí"
                >
                  <Compass className="w-5 h-5 text-indigo-600" />
                </button>
              )}

              {/* External Nav for current active customer */}
              <button
                type="button"
                onClick={() => openExternalNavigation(activeCustomer)}
                className="w-10 h-10 rounded-xl bg-white/95 backdrop-blur-xs text-slate-800 shadow-md border border-slate-200 flex items-center justify-center active:scale-95 transition-all cursor-pointer hover:bg-slate-50"
                title="Chỉ đường trên Google Maps"
              >
                <Navigation className="w-5 h-5 text-emerald-600" />
              </button>
            </div>

            {/* Top-left Radar Status Badge */}
            <div className="absolute top-3 left-3 z-10 bg-slate-900/90 backdrop-blur-md text-white px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2.5 shadow-md border border-slate-700">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-400 animate-ping" />
              <span className="font-mono text-xs sm:text-sm tracking-wide">
                GPS Geofence Radar {CHECK_IN_MAX_DISTANCE_M}m
              </span>
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
            {/* MCP Day Switcher & Route Progress */}
            <div className="space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2.5">
                  <MapPin className="w-5 h-5 text-amber-500 shrink-0" />
                  <div>
                    <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                      Lịch Tuyến Bán Hàng MCP ({filteredBeatCustomers.length} điểm)
                    </h3>
                    <div className="text-xs text-slate-500 mt-0.5">
                      Gán Ngày ghé (T2–T7) trên trang Khách hàng để hiện trong tuyến
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs sm:text-sm font-mono font-bold px-3 py-1 rounded-full bg-emerald-100 text-emerald-800">
                    Đã ghé: {beatVisited}/{beatTotal} ({beatProgress}%)
                  </span>
                </div>
              </div>

              {/* Day selection tabs */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                <button
                  type="button"
                  onClick={() => setSelectedDay('today')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition cursor-pointer flex items-center gap-1 ${
                    selectedDay === 'today'
                      ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <span>Hôm nay ({todayKey})</span>
                </button>
                {(['T2', 'T3', 'T4', 'T5', 'T6', 'T7'] as const).map((day) => (
                  <button
                    key={day}
                    type="button"
                    onClick={() => setSelectedDay(day)}
                    className={`px-2.5 py-1.5 rounded-xl text-xs font-bold shrink-0 transition cursor-pointer ${
                      selectedDay === day
                        ? 'bg-slate-900 text-white font-black shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Thứ {day === 'T7' ? '7' : day.slice(1)}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setSelectedDay('all')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition cursor-pointer ${
                    selectedDay === 'all'
                      ? 'bg-slate-900 text-white font-black shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Tất cả ({customers.length})
                </button>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-500 h-full transition-all duration-300 rounded-full"
                  style={{ width: `${beatProgress}%` }}
                />
              </div>
            </div>

            {/* Multi-Column Grid of Route Stops */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3.5 pt-1">
              {filteredBeatCustomers.length === 0 ? (
                <div className="col-span-full rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center">
                  <p className="text-sm font-bold text-slate-700">
                    Chưa có khách trong tuyến ngày này
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Gán Ngày ghé trên Khách hàng để điểm bán xuất hiện ở đây.
                  </p>
                </div>
              ) : (
                filteredBeatCustomers.map((c: Customer) => {
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
              })
              )}
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
                  {needsGpsPin ? 'Trạng thái GPS cửa hàng' : 'Khoảng cách thực tế'}
                </div>
                <div
                  className={`text-3xl sm:text-4xl lg:text-5xl font-black font-mono mt-1 tracking-tight ${
                    needsGpsPin
                      ? 'text-amber-600'
                      : !hasGpsFix
                        ? 'text-slate-400 text-2xl'
                        : isInRange
                          ? 'text-emerald-600'
                          : 'text-rose-600'
                  }`}
                >
                  {needsGpsPin
                    ? 'Chưa có'
                    : isLocating
                      ? 'Đang dò GPS…'
                      : !hasGpsFix
                        ? 'Chưa có GPS'
                        : formatDistanceDisplay(distanceMeters)}
                </div>
              </div>

              <div className="text-right">
                <div className="text-xs uppercase font-extrabold text-slate-400 tracking-wider">
                  Điều kiện Geofence
                </div>
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs sm:text-sm font-black mt-1 ${
                    needsGpsPin
                      ? 'bg-amber-100 text-amber-900'
                      : !hasGpsFix
                        ? 'bg-slate-200 text-slate-700'
                        : isInRange
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  {needsGpsPin ? (
                    <>
                      <AlertCircle className="w-4 h-4" />
                      <span>Cắm GPS lần đầu</span>
                    </>
                  ) : !hasGpsFix ? (
                    <>
                      <AlertCircle className="w-4 h-4" />
                      <span>Chưa có GPS</span>
                    </>
                  ) : isInRange ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Hợp lệ (&le; {CHECK_IN_MAX_DISTANCE_M}m)</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-4 h-4" />
                      <span>Quá xa (&gt; {CHECK_IN_MAX_DISTANCE_M}m)</span>
                    </>
                  )}
                </span>
              </div>
            </div>

            {/* If GPS is not fixed yet, show prominent helper button */}
            {!hasGpsFix && (
              <button
                type="button"
                onClick={handleRequestRealGps}
                disabled={isLocating}
                className="w-full py-2.5 px-3 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors"
              >
                <LocateFixed className={`w-4 h-4 text-blue-600 ${isLocating ? 'animate-spin' : ''}`} />
                <span>{isLocating ? 'Đang dò vị trí thực tế...' : 'Bấm vào đây để cấp quyền & lấy GPS thực tế'}</span>
              </button>
            )}

            {/* Optional Dev Test Simulation toggle */}
            {process.env.NODE_ENV === 'development' && (
              <div className="pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    if (!isSimulatingGps) {
                      setIsSimulatingGps(true);
                      setHasGpsFix(true);
                      setDistanceMeters(28);
                      if (activeCustomer.hasGps) {
                        setUserLocation({
                          lat: activeCustomer.lat + 0.0002,
                          lng: activeCustomer.lng + 0.0001,
                        });
                      }
                    } else {
                      setIsSimulatingGps(false);
                      handleRequestRealGps();
                    }
                  }}
                  className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1.5 font-medium cursor-pointer transition-colors"
                >
                  <Sliders className="w-3.5 h-3.5 text-amber-500" />
                  <span>{isSimulatingGps ? 'Tắt mô phỏng (Quay lại GPS thật)' : '🧪 Giả lập GPS để test check-in tại bàn (Dev only)'}</span>
                </button>

                {isSimulatingGps && (
                  <div className="mt-2 space-y-1.5 p-2.5 rounded-xl bg-amber-50/70 border border-amber-200">
                    <div className="flex items-center justify-between text-xs text-slate-700 font-bold">
                      <span>Mô phỏng khoảng cách:</span>
                      <span className="font-mono font-black text-amber-900 bg-amber-200/80 px-2 py-0.5 rounded text-xs">
                        {distanceMeters}m
                      </span>
                    </div>
                    <input
                      type="range"
                      min="5"
                      max="400"
                      step="5"
                      value={Math.min(400, Math.max(5, distanceMeters || 5))}
                      onChange={(e) => {
                        const m = Number(e.target.value);
                        setDistanceMeters(m);
                        if (activeCustomer.hasGps) {
                          setUserLocation({
                            lat: activeCustomer.lat + (m / 111000),
                            lng: activeCustomer.lng + (m / 111000),
                          });
                        }
                      }}
                      className="w-full h-2.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-amber-500"
                    />
                    <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                      <span className="text-emerald-700 font-bold">5m</span>
                      <span className="text-amber-700 font-bold">{CHECK_IN_MAX_DISTANCE_M}m (Ngưỡng)</span>
                      <span>400m</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Hidden Mobile Camera Input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handlePhotoSelect}
              className="hidden"
            />

            {/* The Tactile Check-In Action Button */}
            <div className="pt-2 space-y-3">
              {isCheckedIn ? (
                <div className="space-y-3">
                  <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-sm text-emerald-900 font-bold space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                        <span>Đã Check-in tại {activeCustomer.name}</span>
                      </div>
                      <span className="font-mono text-emerald-700 text-xs font-bold">&plusmn;{distanceMeters}m</span>
                    </div>

                    {checkInPhoto && (
                      <div className="relative rounded-xl overflow-hidden border border-emerald-300 max-h-36 bg-black">
                        <img
                          src={checkInPhoto}
                          alt="Ảnh biển hiệu"
                          className="w-full h-36 object-cover"
                        />
                        <div className="absolute bottom-0 inset-x-0 bg-slate-950/75 text-white p-1.5 text-[10px] font-mono flex items-center justify-between">
                          <span className="flex items-center gap-1 font-sans font-semibold">
                            <Camera className="size-3 text-emerald-400" />
                            Biển hiệu garage
                          </span>
                          <span>{userLocation ? `${userLocation.lat.toFixed(4)}, ${userLocation.lng.toFixed(4)}` : 'Chưa có GPS'}</span>
                        </div>
                      </div>
                    )}
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
                <div className="space-y-3">
                  {/* Photo Capture Card Before Check-in */}
                  {checkInPhoto ? (
                    <div className="relative rounded-2xl overflow-hidden border-2 border-emerald-400 shadow-sm bg-slate-950">
                      <img
                        src={checkInPhoto}
                        alt="Ảnh biển hiệu vừa chụp"
                        className="w-full h-40 object-cover"
                      />
                      <div className="absolute top-2 right-2 flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="rounded-lg bg-slate-900/80 hover:bg-slate-900 text-white px-2 py-1 text-xs font-bold backdrop-blur-xs flex items-center gap-1 cursor-pointer"
                        >
                          <Camera className="size-3" />
                          <span>Chụp lại</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setCheckInPhoto(null)}
                          className="rounded-lg bg-rose-600/90 hover:bg-rose-600 text-white p-1 text-xs cursor-pointer"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                      <div className="absolute bottom-0 inset-x-0 bg-linear-to-t from-black/90 via-black/60 to-transparent text-white p-2.5 text-xs">
                        <div className="font-bold text-amber-300 flex items-center gap-1">
                          <CheckCircle2 className="size-3.5 text-emerald-400" />
                          <span>Đã chụp ảnh biển hiệu Garage đối chiếu</span>
                        </div>
                        <div className="text-[10px] font-mono text-slate-300 mt-0.5">
                          Tọa độ GPS: {userLocation ? `${userLocation.lat.toFixed(5)}, ${userLocation.lng.toFixed(5)}` : 'Chưa có GPS'}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full py-3 px-4 rounded-2xl border-2 border-dashed border-amber-300 hover:border-amber-500 bg-amber-50/60 hover:bg-amber-100/70 text-slate-800 flex items-center justify-between transition-colors cursor-pointer group"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-xl bg-amber-500 text-slate-950 group-hover:scale-105 transition-transform">
                          <Camera className="size-4.5" />
                        </div>
                        <div className="text-left">
                          <div className="text-xs font-extrabold text-slate-900">
                            Chụp Ảnh Biển Hiệu / Đồng Hồ Xe
                          </div>
                          <div className="text-[11px] text-slate-500">
                            Bằng chứng đối chiếu viếng thăm thực tế
                          </div>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-amber-800 bg-amber-200/80 px-2 py-0.5 rounded-lg">
                        Mở Camera
                      </span>
                    </button>
                  )}

                  <button
                    id="pwa-checkin-action-btn"
                    onClick={handleCheckIn}
                    disabled={isCheckingIn}
                    className="w-full h-16 rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 active:scale-[0.98] text-white font-black text-base sm:text-lg flex flex-col items-center justify-center shadow-lg shadow-emerald-600/30 transition-all cursor-pointer animate-pulse disabled:opacity-60"
                  >
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-white" />
                      <span>
                        {isCheckingIn
                          ? 'ĐANG LƯU…'
                          : needsGpsPin
                            ? 'CẮM GPS & CHECK-IN'
                            : `CHECK-IN ĐIỂM BÁN (CÁCH ${formatDistanceDisplay(distanceMeters)})`}
                      </span>
                    </div>
                    <span className="text-xs text-emerald-100 font-normal tracking-wide">
                      {needsGpsPin
                        ? 'Lưu tọa độ cửa hàng từ GPS hiện tại'
                        : checkInPhoto
                          ? 'Đã đính kèm ảnh biển hiệu'
                          : 'Đã vào đúng bán kính Geofence'}{' '}
                      &bull; Nhấn để mở khóa lên đơn
                    </span>
                  </button>
                </div>
              ) : !hasGpsFix ? (
                <button
                  type="button"
                  onClick={handleRequestRealGps}
                  disabled={isLocating}
                  className="w-full h-14 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-base flex items-center justify-center gap-2 shadow-md cursor-pointer transition-all"
                >
                  <LocateFixed className={`w-5 h-5 ${isLocating ? 'animate-spin' : ''}`} />
                  <span>{isLocating ? 'ĐANG DÒ VỊ TRÍ GPS THỰC TẾ…' : 'BẬT ĐỊNH VỊ GPS ĐỂ CHECK-IN'}</span>
                </button>
              ) : (
                <div className="w-full p-4 sm:p-5 rounded-2xl bg-slate-100 text-slate-600 flex flex-col items-center justify-center text-center border border-slate-200 space-y-2">
                  <div className="font-extrabold text-sm sm:text-base text-rose-600 flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>
                      Bạn đang ở cách điểm bán {formatDistanceDisplay(distanceMeters)}
                    </span>
                  </div>
                  <div className="text-xs sm:text-sm text-slate-500">
                    Chỉ được phép Check-in khi bạn đứng trong bán kính ≤ {CHECK_IN_MAX_DISTANCE_M}m từ cửa hàng.
                  </div>
                  <div className="flex items-center gap-2 pt-1 w-full">
                    <button
                      type="button"
                      onClick={() => openExternalNavigation(activeCustomer)}
                      className="flex-1 py-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer transition-colors"
                    >
                      <Navigation className="w-4 h-4 text-emerald-600" />
                      <span>Mở Google Maps chỉ đường</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleRequestRealGps}
                      className="py-2.5 px-3 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-blue-600 text-xs font-bold flex items-center justify-center gap-1 shadow-2xs cursor-pointer transition-colors"
                      title="Lấy lại GPS"
                    >
                      <LocateFixed className="w-4 h-4" />
                      <span>Dò lại</span>
                    </button>
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
