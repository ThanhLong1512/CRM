"use client";
import { useState, useMemo, useEffect } from 'react';
import { Product, Customer } from '../../types';
import { formatVND } from '../../mockData';
import { soundFX } from '../../utils/audio';
import {
  Search,
  Plus,
  Minus,
  ArrowRight,
  Sparkles,
  BookOpen,
  CheckCircle2,
} from 'lucide-react';
import PwaNumpadDrawer from './PwaNumpadDrawer';
import LubeGuideModal from '../LubeGuideModal';
import { usePagination } from '../../../hooks/usePagination';
import Pagination from '../../common/Pagination';

interface PwaFastCatalogProps {
  products: Product[];
  activeCustomer: Customer;
  cart: Record<string, number>;
  onUpdateCartQty: (productId: string, delta: number) => void;
  onSetCartQty: (productId: string, quantity: number) => void;
  onOpenReviewDrawer: () => void;
}

const CATEGORIES = [
  { id: 'all', label: 'Tất cả' },
  { id: 'engine', label: 'Nhớt Động Cơ' },
  { id: 'gear', label: 'Dầu Cầu Hộp Số' },
  { id: 'hydraulic', label: 'Thủy Lực 68' },
  { id: 'coolant', label: 'Nước Làm Mát' },
  { id: 'additive', label: 'Phụ Gia' },
];

/**
 * Calculates actual volume in Liters from packageType or volumeLiters
 */
function getLitersPerUnit(product: Product): number {
  if (product.volumeLiters && product.volumeLiters > 0) return product.volumeLiters;
  const pkg = product.packageType || '';
  if (pkg.includes('208')) return 208;
  if (pkg.includes('200')) return 200;
  if (pkg.includes('18')) return 18;
  if (pkg.includes('5L')) return 5;
  if (pkg.includes('4')) return 4;
  if (pkg.includes('1L') || pkg.includes('1')) return 1;
  return 1;
}

/**
 * Returns color tokens for each packaging format
 */
function getPackageBadge(packageType: string) {
  if (packageType.includes('Phuy')) {
    return {
      bg: 'bg-sky-100 text-sky-900 border-sky-300',
      label: packageType,
    };
  }
  if (packageType.includes('Thùng') || packageType.includes('Xô 18')) {
    return {
      bg: 'bg-amber-100 text-amber-900 border-amber-300',
      label: packageType,
    };
  }
  if (packageType.includes('Can') || packageType.includes('4L')) {
    return {
      bg: 'bg-emerald-100 text-emerald-900 border-emerald-300',
      label: packageType,
    };
  }
  return {
    bg: 'bg-purple-100 text-purple-900 border-purple-300',
    label: packageType,
  };
}

export default function PwaFastCatalog({
  products,
  activeCustomer,
  cart,
  onUpdateCartQty,
  onSetCartQty,
  onOpenReviewDrawer,
}: PwaFastCatalogProps) {
  const [selectedCat, setSelectedCat] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showLubeGuide, setShowLubeGuide] = useState<boolean>(false);
  const [numpadProduct, setNumpadProduct] = useState<{ product: Product; unitPrice: number } | null>(null);

  // Determine applicable price based on customer type
  const getProductPrice = (p: Product) => {
    if (activeCustomer.type === 'Đội xe') return p.priceFleet;
    if (activeCustomer.type === 'Thợ') return p.priceMechanic;
    return p.priceDealer;
  };

  // 1-Tap Reorder Favorite Product for Active Customer
  const favoriteProduct = useMemo(() => {
    if (activeCustomer.favoriteSku) {
      const match = products.find(
        (p) => p.sku === activeCustomer.favoriteSku || p.id === activeCustomer.favoriteSku
      );
      if (match) return match;
    }
    return products[0];
  }, [products, activeCustomer]);

  // Filter products by category and search
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      // Category filter
      if (selectedCat === 'engine' && !p.category.toLowerCase().includes('động cơ') && !p.category.toLowerCase().includes('diesel') && !p.category.toLowerCase().includes('xăng')) return false;
      if (selectedCat === 'gear' && !p.category.toLowerCase().includes('cầu') && !p.category.toLowerCase().includes('hộp số')) return false;
      if (selectedCat === 'hydraulic' && !p.category.toLowerCase().includes('thủy lực')) return false;
      if (selectedCat === 'coolant' && !p.category.toLowerCase().includes('mát')) return false;
      if (selectedCat === 'additive' && !p.category.toLowerCase().includes('phụ gia')) return false;

      // Search term filter
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          p.viscosity.toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [products, selectedCat, searchQuery]);

  // Universal Pagination for Catalog (9 items / page = 3x3 grid)
  const {
    currentPage,
    pageSize,
    totalPages,
    paginatedItems: paginatedProducts,
    startIndex,
    endIndex,
    totalItems: catalogTotalItems,
    goToPage,
    setPageSize,
    resetPage,
  } = usePagination(filteredProducts, {
    initialPageSize: 9,
    pageSizeOptions: [6, 9, 12, 24],
  });

  // Auto-reset page to 1 when filters or search change
  useEffect(() => {
    resetPage();
  }, [selectedCat, searchQuery, resetPage]);

  // Derived cart analytics
  const totalCartCount = Object.values(cart).reduce<number>((sum, qty) => sum + (Number(qty) || 0), 0);
  const totalCartValue = useMemo(() => {
    return Object.entries(cart).reduce<number>((sum, [prodId, qty]) => {
      const prod = products.find((p) => p.id === prodId);
      if (!prod) return sum;
      return sum + (Number(qty) || 0) * getProductPrice(prod);
    }, 0);
  }, [cart, products, activeCustomer]);

  // Audio assisted cart update
  const handleStepQty = (productId: string, delta: number) => {
    soundFX.playClick();
    onUpdateCartQty(productId, delta);
  };

  return (
    <div id="pwa-fast-catalog" className="flex flex-col h-full bg-slate-50 select-none w-full">
      {/* Sticky Top Filter Section */}
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-2xs">
        {/* Customer Tier Price Banner */}
        <div className="px-4 py-2.5 bg-slate-900 text-white flex items-center justify-between text-xs sm:text-sm font-medium">
          <div className="flex items-center gap-2 truncate">
            <span className="text-slate-400">Đơn giá áp dụng:</span>
            <span className="font-extrabold text-amber-400">
              {activeCustomer.type === 'Đội xe'
                ? 'Bảng Giá Đội Xe (Fleet)'
                : activeCustomer.type === 'Thợ'
                ? 'Bảng Giá Thợ Máy (Garage)'
                : 'Bảng Giá Đại Lý Cấp 1'}
            </span>
          </div>
          <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded bg-slate-800 text-slate-300">
            {activeCustomer.name.slice(0, 20)}
          </span>
        </div>

        {/* Quick Search Bar & Lube Guide Action */}
        <div className="p-3.5 pb-2 w-full flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm mã nhớt, 15W-40, VG 68, Castrol, Shell..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-11 pl-10 pr-8 rounded-xl bg-slate-100 text-xs sm:text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/50 border border-slate-200"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400 p-1 hover:text-slate-700"
              >
                &times;
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={() => setShowLubeGuide(true)}
            className="h-11 px-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shrink-0 shadow-xs cursor-pointer active:scale-95 transition-transform"
            title="Tra cứu Lube Guide & Đổi mã nhớt đối thủ"
          >
            <BookOpen className="w-4 h-4" />
            <span className="hidden sm:inline">Lube Guide</span>
          </button>
        </div>

        {/* Horizontal Sticky Snap-Scroll Categories */}
        <div className="px-3.5 pb-3 overflow-x-auto snap-x flex gap-2 w-full no-scrollbar">
          {CATEGORIES.map((cat) => {
            const isActive = selectedCat === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => {
                  setSelectedCat(cat.id);
                  soundFX.playClick();
                }}
                className={`snap-start h-10 min-h-[40px] px-4 rounded-full text-xs sm:text-sm font-bold whitespace-nowrap transition-all duration-150 cursor-pointer ${
                  isActive
                    ? 'bg-amber-500 text-slate-950 shadow-xs scale-102 font-black'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 1-Tap Quick Reorder / Favorite Product for this Customer */}
      {favoriteProduct && (
        <div className="mx-4 sm:mx-5 mt-4 p-4 rounded-2xl bg-linear-to-r from-amber-500/15 via-amber-500/5 to-transparent border border-amber-300/80 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="size-11 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center shrink-0 shadow-xs">
              <Sparkles className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-900 bg-amber-200 px-2 py-0.5 rounded">
                  ⭐ Hàng Hay Nhập Nhất Của Khách
                </span>
                <span className="font-mono text-xs font-bold text-slate-600">
                  {favoriteProduct.viscosity}
                </span>
              </div>
              <h4 className="text-sm sm:text-base font-extrabold text-slate-900 mt-0.5 leading-tight">
                {favoriteProduct.name}
              </h4>
              <div className="flex items-center gap-2 text-xs font-mono mt-0.5">
                <span className="font-black text-amber-700">
                  {formatVND(getProductPrice(favoriteProduct))}
                </span>
                <span className="text-slate-400">&bull;</span>
                <span className="text-slate-500 font-semibold">
                  ~{formatVND(Math.round(getProductPrice(favoriteProduct) / getLitersPerUnit(favoriteProduct)))}/Lít
                </span>
              </div>
            </div>
          </div>

          {/* 1-Tap Instant Add Buttons */}
          <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
            <button
              type="button"
              onClick={() => handleStepQty(favoriteProduct.id, 1)}
              className="flex-1 sm:flex-initial h-11 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-md cursor-pointer transition-all"
            >
              <Plus className="size-4" />
              <span>+1 {favoriteProduct.packageType.includes('Phuy') ? 'Phuy' : 'Thùng'} Ngay</span>
            </button>
            {favoriteProduct.packageType.includes('Phuy') && (
              <button
                type="button"
                onClick={() => handleStepQty(favoriteProduct.id, 2)}
                className="flex-1 sm:flex-initial h-11 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 active:scale-95 text-white font-extrabold text-xs flex items-center justify-center gap-1 shadow-md cursor-pointer transition-all"
              >
                <span>+2 Phuy Combo</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Product List Canvas - Redesigned Modern 3-Column Grid */}
      <div className="p-4 sm:p-5 w-full grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {paginatedProducts.length === 0 ? (
          <div className="col-span-full py-16 text-center text-slate-400 text-sm font-medium">
            Không tìm thấy sản phẩm phù hợp với từ khóa
          </div>
        ) : (
          paginatedProducts.map((product) => {
            const unitPrice = getProductPrice(product);
            const inCartQty = cart[product.id] || 0;
            const isLowStock = product.stock <= product.minSafeStock;
            const litersPerUnit = getLitersPerUnit(product);
            const pricePerLiter = Math.round(unitPrice / litersPerUnit);
            const badgeInfo = getPackageBadge(product.packageType);

            return (
              <div
                key={product.id}
                id={`pwa-product-card-${product.id}`}
                className={`bg-white rounded-2xl border transition-all duration-150 flex flex-col justify-between overflow-hidden shadow-xs hover:shadow-md ${
                  inCartQty > 0
                    ? 'border-amber-400 ring-2 ring-amber-400/25 bg-amber-50/10'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                {/* Card Top: Tags, Full Title, Specs, Stock */}
                <div className="p-4.5 pb-3.5 flex-1 flex flex-col justify-between">
                  <div>
                    {/* Badges Row */}
                    <div className="flex items-center justify-between gap-2 mb-2.5">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md font-mono border ${badgeInfo.bg}`}>
                          {product.packageType}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-900 text-amber-300 font-mono">
                          {product.viscosity}
                        </span>
                        {product.drumReturnable && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-sky-100 text-sky-800 border border-sky-200">
                            Cọc vỏ 400k
                          </span>
                        )}
                      </div>
                      <span className="font-mono text-[11px] font-semibold text-slate-400 shrink-0">
                        {product.sku}
                      </span>
                    </div>

                    {/* Full Product Name (2 lines, not cut off) */}
                    <h4
                      className="font-extrabold text-slate-900 text-sm sm:text-base leading-snug line-clamp-2 min-h-[2.6rem]"
                      title={product.name}
                    >
                      {product.name}
                    </h4>

                    {/* Brand & Standards Spec */}
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                      <span className="font-medium">{product.brand}</span>
                      {product.standards && (
                        <>
                          <span className="text-slate-300">&bull;</span>
                          <span className="truncate text-slate-400 font-mono text-[11px]">
                            {product.standards}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Stock Level with Colored Dot */}
                  <div className="flex items-center gap-2 text-xs mt-3 pt-2.5 border-t border-slate-100">
                    <span
                      className={`size-2 rounded-full shrink-0 ${
                        isLowStock ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500'
                      }`}
                    />
                    {isLowStock ? (
                      <span className="text-rose-600 font-semibold text-xs">
                        Sắp hết hàng &bull; Còn {product.stock} {product.packageType}
                      </span>
                    ) : (
                      <span className="text-slate-600 text-xs font-medium">
                        Còn <strong className="text-slate-900 font-mono font-bold">{product.stock}</strong> {product.packageType} tại Kho Tổng
                      </span>
                    )}
                  </div>
                </div>

                {/* Card Bottom: Clear Packaging Price, Unit Price, and Tactile Stepper */}
                <div className="px-4.5 py-3 bg-slate-50/75 border-t border-slate-100 flex items-center justify-between gap-3">
                  {/* Price Stack */}
                  <div className="min-w-0">
                    <div className="flex items-baseline gap-1 font-mono leading-tight">
                      <span className="text-base sm:text-lg font-black text-amber-700">
                        {formatVND(unitPrice)}
                      </span>
                      <span className="text-[11px] text-slate-500 font-sans font-medium truncate">
                        / {product.packageType}
                      </span>
                    </div>
                    <div className="text-[10px] font-mono font-semibold text-slate-500 mt-0.5">
                      ~{formatVND(pricePerLiter)}/Lít
                    </div>
                  </div>

                  {/* Stepper or Add Button */}
                  {inCartQty === 0 ? (
                    <button
                      type="button"
                      onClick={() => handleStepQty(product.id, 1)}
                      className="h-10 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-2xs cursor-pointer transition-all shrink-0"
                      title="Thêm vào giỏ hàng"
                    >
                      <Plus className="size-4 stroke-[2.5]" />
                      <span>Thêm</span>
                    </button>
                  ) : (
                    <div className="flex items-center gap-1 bg-white border border-amber-300 rounded-xl p-0.5 shadow-2xs shrink-0">
                      <button
                        type="button"
                        onClick={() => handleStepQty(product.id, -1)}
                        className="size-8.5 rounded-lg flex items-center justify-center text-slate-700 hover:bg-slate-100 active:scale-90 transition-all cursor-pointer"
                        title="Giảm số lượng"
                      >
                        <Minus className="size-3.5 stroke-[2.5]" />
                      </button>

                      <button
                        type="button"
                        onClick={() => setNumpadProduct({ product, unitPrice })}
                        className="min-w-[36px] h-8.5 px-1.5 flex flex-col items-center justify-center font-mono font-black text-sm text-slate-950 hover:bg-amber-50 rounded-md transition-colors cursor-pointer"
                        title="Bấm để nhập số lượng bàn phím số"
                      >
                        <span>{inCartQty}</span>
                        <span className="text-[8px] text-slate-400 font-sans leading-none">chạm sửa</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleStepQty(product.id, 1)}
                        className="size-8.5 rounded-lg bg-amber-500 hover:bg-amber-400 active:scale-90 text-slate-950 font-bold flex items-center justify-center transition-all cursor-pointer shadow-2xs"
                        title="Tăng số lượng"
                      >
                        <Plus className="size-3.5 stroke-[2.5]" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Universal Pagination Bar at bottom of Catalog */}
      <div className="px-4 sm:px-5 pb-28 pt-2">
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            pageSize={pageSize}
            totalItems={catalogTotalItems}
            startIndex={startIndex}
            endIndex={endIndex}
            onPageChange={goToPage}
            onPageSizeChange={setPageSize}
            pageSizeOptions={[6, 9, 12, 24]}
            itemLabel="sản phẩm"
          />
        </div>
      </div>

      {/* Persistent Floating Cart Strip */}
      {totalCartCount > 0 && (
        <div
          id="pwa-floating-cart-strip"
          className="fixed bottom-4 left-0 right-0 z-30 px-4 pointer-events-none"
        >
          <div className="max-w-2xl mx-auto bg-slate-900 text-white rounded-2xl shadow-2xl p-4 sm:p-5 flex items-center justify-between gap-4 border border-slate-700 pointer-events-auto animate-in slide-in-from-bottom duration-200">
            {/* Left: Item Counter & Sum */}
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-amber-500 text-slate-950 font-mono font-black text-base flex items-center justify-center shrink-0">
                {totalCartCount}
              </div>
              <div>
                <div className="text-xs uppercase font-extrabold text-slate-400 font-mono tracking-wider">
                  Tạm tính giỏ hàng
                </div>
                <div className="text-lg sm:text-xl lg:text-2xl font-black font-mono text-amber-400 leading-tight">
                  {formatVND(totalCartValue)}
                </div>
              </div>
            </div>

            {/* Right: Trigger to Open Review Drawer */}
            <button
              id="pwa-open-cart-review-btn"
              onClick={() => {
                soundFX.playClick();
                onOpenReviewDrawer();
              }}
              className="h-12 px-5 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 font-black text-sm sm:text-base flex items-center gap-2 shadow-md shadow-amber-500/20 transition-all cursor-pointer font-mono"
            >
              <span>Xem Đơn Hàng</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Large Numpad Drawer for Bulk Entry */}
      {numpadProduct && (
        <PwaNumpadDrawer
          product={numpadProduct.product}
          currentQty={cart[numpadProduct.product.id] || 0}
          unitPrice={numpadProduct.unitPrice}
          onConfirm={(newQty) => {
            onSetCartQty(numpadProduct.product.id, newQty);
            setNumpadProduct(null);
          }}
          onClose={() => setNumpadProduct(null)}
        />
      )}

      {/* Lube Guide & Cross Reference Modal */}
      <LubeGuideModal
        isOpen={showLubeGuide}
        onClose={() => setShowLubeGuide(false)}
        onSelectProductSku={(sku) => {
          setSearchQuery(sku);
          setShowLubeGuide(false);
        }}
      />
    </div>
  );
}
