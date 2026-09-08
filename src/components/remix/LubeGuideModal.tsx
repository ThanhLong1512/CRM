"use client";

import { useState, useMemo } from "react";
import {
  VEHICLE_LUBE_GUIDES,
  LUBE_CROSS_REFERENCES,
  type VehicleLubeSpec,
  type LubeCrossReference,
} from "@/lib/data/lubeSpecs";
import {
  BookOpen,
  ArrowRightLeft,
  Search,
  X,
  Truck,
  Car,
  Bike,
  Wrench,
  Cpu,
  CheckCircle2,
  Sparkles,
  Info,
  ShieldCheck,
  Package,
} from "lucide-react";

interface LubeGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectProductSku?: (sku: string) => void;
}

export default function LubeGuideModal({
  isOpen,
  onClose,
  onSelectProductSku,
}: LubeGuideModalProps) {
  const [activeTab, setActiveTab] = useState<"vehicles" | "crossRef">("vehicles");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedVehicleCategory, setSelectedVehicleCategory] = useState<string>("all");
  const [selectedBrand, setSelectedBrand] = useState<string>("all");

  const vehicleCategories = [
    { id: "all", label: "Tất cả phương tiện" },
    { id: "Xe máy", label: "Xe máy 2 bánh", icon: Bike },
    { id: "Ô tô du lịch", label: "Ô tô con / SUV", icon: Car },
    { id: "Xe tải & Đầu kéo", label: "Xe tải & Đầu kéo", icon: Truck },
    { id: "Máy công trình & Thủy lực", label: "Máy công trình", icon: Wrench },
    { id: "Thiết bị công nghiệp", label: "Công nghiệp", icon: Cpu },
  ];

  const competitorBrands = [
    { id: "all", label: "Tất cả hãng" },
    { id: "Castrol", label: "Castrol" },
    { id: "Shell", label: "Shell" },
    { id: "Mobil", label: "Mobil" },
    { id: "Motul", label: "Motul" },
    { id: "TotalEnergies", label: "Total" },
    { id: "Caltex", label: "Caltex" },
  ];

  // Filtered vehicles
  const filteredVehicles = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return VEHICLE_LUBE_GUIDES.filter((v) => {
      const matchCat =
        selectedVehicleCategory === "all" || v.category === selectedVehicleCategory;
      const matchSearch =
        !q ||
        v.modelName.toLowerCase().includes(q) ||
        v.engineOilSpec.toLowerCase().includes(q) ||
        v.notes.toLowerCase().includes(q);
      return matchCat && matchSearch;
    });
  }, [searchQuery, selectedVehicleCategory]);

  // Filtered cross-references
  const filteredCrossRefs = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return LUBE_CROSS_REFERENCES.filter((cr) => {
      const matchBrand =
        selectedBrand === "all" || cr.competitorBrand === selectedBrand;
      const matchSearch =
        !q ||
        cr.competitorProduct.toLowerCase().includes(q) ||
        cr.equivalentProduct.toLowerCase().includes(q) ||
        cr.viscosityGrade.toLowerCase().includes(q) ||
        cr.category.toLowerCase().includes(q) ||
        cr.techAdvantage.toLowerCase().includes(q);
      return matchBrand && matchSearch;
    });
  }, [searchQuery, selectedBrand]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-3 sm:p-5 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-linear-to-r from-slate-900 to-slate-800 px-5 py-4 text-white">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-2xl bg-amber-500 text-slate-950 shadow-md">
              <BookOpen className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-white sm:text-lg">
                  Lube Guide &amp; Đối Chiếu Nhớt Chéo
                </h3>
                <span className="rounded-full bg-amber-400/20 px-2 py-0.5 text-[10px] font-bold text-amber-300">
                  Cẩm Nang Kỹ Thuật 0Đ
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Tra cứu dung tích/cấp nhớt theo xe &amp; chuyển đổi mã nhớt đối thủ sang sản phẩm kho
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex size-8 items-center justify-center rounded-xl bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white transition-colors cursor-pointer"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Tab Switcher & Search Bar */}
        <div className="border-b border-slate-100 bg-slate-50/80 p-4 space-y-3 shrink-0">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Primary Tab Switcher */}
            <div className="flex rounded-xl bg-slate-200/80 p-1">
              <button
                type="button"
                onClick={() => setActiveTab("vehicles")}
                className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                  activeTab === "vehicles"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Truck className="size-3.5" />
                <span>1. Tra Theo Phương Tiện ({VEHICLE_LUBE_GUIDES.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("crossRef")}
                className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                  activeTab === "crossRef"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <ArrowRightLeft className="size-3.5" />
                <span>2. Đối Chiếu Hãng Chéo ({LUBE_CROSS_REFERENCES.length})</span>
              </button>
            </div>

            {/* Universal Search Input */}
            <div className="relative flex-1 sm:max-w-xs">
              <Search className="absolute left-3 top-2.5 size-3.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  activeTab === "vehicles"
                    ? "Tìm xe Hino, Vios, Exciter, Komatsu..."
                    : "Tìm Castrol CRB, Shell Rimula, Tellus 68..."
                }
                className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-8 text-xs font-medium text-slate-800 placeholder-slate-400 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Sub-Filters */}
          {activeTab === "vehicles" ? (
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              {vehicleCategories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedVehicleCategory(cat.id)}
                  className={`cursor-pointer rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors ${
                    selectedVehicleCategory === cat.id
                      ? "bg-slate-900 text-white font-bold"
                      : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              {competitorBrands.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => setSelectedBrand(b.id)}
                  className={`cursor-pointer rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors ${
                    selectedBrand === b.id
                      ? "bg-amber-500 text-slate-950 font-bold"
                      : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  {b.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {activeTab === "vehicles" ? (
            /* TAB 1: VEHICLES SPECS */
            filteredVehicles.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">
                Không tìm thấy dòng xe hoặc thiết bị khớp với từ khóa.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredVehicles.map((v) => (
                  <div
                    key={v.id}
                    className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-xs hover:border-amber-300 hover:shadow-md transition-all"
                  >
                    <div className="space-y-3">
                      {/* Title & Category */}
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="inline-block rounded bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                            {v.category}
                          </span>
                          <h4 className="mt-1 text-sm font-extrabold text-slate-900 leading-tight">
                            {v.modelName}
                          </h4>
                        </div>
                        <span className="font-mono text-[10px] text-slate-400 font-bold">
                          {v.id}
                        </span>
                      </div>

                      {/* Technical Specs Matrix */}
                      <div className="divide-y divide-slate-100 rounded-xl bg-slate-50 p-3 text-xs space-y-2">
                        <div className="flex items-baseline justify-between pt-1">
                          <span className="font-semibold text-slate-500">Dung tích nhớt máy:</span>
                          <span className="font-bold text-blue-800">{v.engineOilCapacity}</span>
                        </div>
                        <div className="flex items-baseline justify-between pt-2">
                          <span className="font-semibold text-slate-500">Cấp nhớt khuyến nghị:</span>
                          <span className="font-bold text-slate-900">{v.engineOilSpec}</span>
                        </div>
                        {v.transmissionOilCapacity && (
                          <div className="flex items-baseline justify-between pt-2">
                            <span className="font-semibold text-slate-500">Dầu hộp số / Cầu:</span>
                            <span className="font-medium text-slate-800">{v.transmissionOilCapacity}</span>
                          </div>
                        )}
                        {v.hydraulicOilCapacity && (
                          <div className="flex items-baseline justify-between pt-2">
                            <span className="font-semibold text-slate-500">Dầu thủy lực:</span>
                            <span className="font-bold text-cyan-800">{v.hydraulicOilCapacity}</span>
                          </div>
                        )}
                        {v.coolantCapacity && (
                          <div className="flex items-baseline justify-between pt-2">
                            <span className="font-semibold text-slate-500">Nước làm mát:</span>
                            <span className="font-medium text-slate-800">{v.coolantCapacity}</span>
                          </div>
                        )}
                        <div className="flex items-baseline justify-between pt-2">
                          <span className="font-semibold text-slate-500">Chu kỳ thay nhớt:</span>
                          <span className="font-mono font-bold text-emerald-700">{v.changeInterval}</span>
                        </div>
                      </div>

                      {/* Notes */}
                      <div className="flex items-start gap-1.5 rounded-xl border border-amber-200/80 bg-amber-50/70 p-2.5 text-[11px] text-amber-900">
                        <Info className="size-3.5 shrink-0 text-amber-600 mt-0.5" />
                        <span className="leading-snug">{v.notes}</span>
                      </div>
                    </div>

                    {/* Action Footer */}
                    {v.recommendedSku && onSelectProductSku && (
                      <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                        <span className="font-mono text-[11px] text-slate-500">
                          Mã kho: <strong>{v.recommendedSku}</strong>
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            onSelectProductSku(v.recommendedSku!);
                            onClose();
                          }}
                          className="flex items-center gap-1 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-bold text-white hover:bg-amber-500 hover:text-slate-950 transition-colors cursor-pointer"
                        >
                          <Package className="size-3" />
                          <span>Chọn mã này</span>
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )
          ) : (
            /* TAB 2: COMPETITOR CROSS REFERENCES */
            filteredCrossRefs.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">
                Không tìm thấy mã đối thủ khớp với từ khóa tìm kiếm.
              </div>
            ) : (
              <div className="space-y-3">
                {filteredCrossRefs.map((cr) => (
                  <div
                    key={cr.id}
                    className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs hover:border-amber-300 hover:shadow-md transition-all"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                      {/* Left: Competitor */}
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="rounded bg-rose-100 px-2 py-0.5 text-[10px] font-extrabold text-rose-800 uppercase tracking-wider">
                            Hãng {cr.competitorBrand}
                          </span>
                          <span className="text-[11px] font-semibold text-slate-500">
                            {cr.category}
                          </span>
                        </div>
                        <div className="text-sm font-bold text-slate-800">
                          {cr.competitorProduct}
                        </div>
                        <div className="flex items-center gap-2 text-[11px] font-mono text-slate-500">
                          <span>Cấp độ nhớt: <strong>{cr.viscosityGrade}</strong></span>
                          <span>&bull;</span>
                          <span>Chuẩn: <strong>{cr.standard}</strong></span>
                        </div>
                      </div>

                      {/* Middle: Equivalence Arrow */}
                      <div className="flex items-center justify-center text-amber-500 font-bold text-xs py-1 md:px-4">
                        <ArrowRightLeft className="size-5 animate-pulse" />
                      </div>

                      {/* Right: In-House Equivalent */}
                      <div className="flex-1 space-y-1 bg-emerald-50/70 border border-emerald-200/80 rounded-xl p-3">
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-800 uppercase tracking-wider">
                            <ShieldCheck className="size-3.5 text-emerald-600" />
                            Sản phẩm kho tương đương
                          </span>
                          <span className="rounded bg-emerald-600 px-1.5 py-0.2 font-mono text-[10px] font-bold text-white">
                            {cr.inStock ? "Sẵn hàng" : "Đặt nhanh"}
                          </span>
                        </div>
                        <div className="text-sm font-extrabold text-emerald-950">
                          {cr.equivalentProduct}
                        </div>
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-mono text-slate-600">
                            Mã SKU: <strong>{cr.equivalentSku}</strong> ({cr.packageType})
                          </span>
                          {onSelectProductSku && (
                            <button
                              type="button"
                              onClick={() => {
                                onSelectProductSku(cr.equivalentSku);
                                onClose();
                              }}
                              className="font-bold text-emerald-800 hover:text-emerald-950 underline cursor-pointer"
                            >
                              Chọn sản phẩm
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Tech Advantage Explanation */}
                    <div className="mt-2.5 flex items-start gap-2 text-xs text-slate-600">
                      <Sparkles className="size-4 shrink-0 text-amber-500 mt-0.5" />
                      <p className="leading-relaxed">
                        <strong>Lợi thế thuyết phục khách:</strong> {cr.techAdvantage}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50 px-5 py-3 shrink-0">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
            <CheckCircle2 className="size-4 text-emerald-600" />
            <span>Dữ liệu chuẩn hóa theo tài liệu kỹ thuật của các hãng dầu nhớt hàng đầu tại Việt Nam</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-xl bg-slate-900 px-5 py-2 text-xs font-bold text-white hover:bg-slate-800"
          >
            Đóng bảng tra
          </button>
        </div>
      </div>
    </div>
  );
}
