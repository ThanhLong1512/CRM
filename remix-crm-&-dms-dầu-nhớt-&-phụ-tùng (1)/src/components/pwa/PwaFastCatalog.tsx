import { useState, useMemo } from 'react';
import { Product, Customer } from '../../types';
import { formatVND } from '../../mockData';
import { soundFX } from '../../utils/audio';
import {
  Search,
  Plus,
  Minus,
  ShoppingCart,
  ArrowRight,
  Package,
  Layers,
  Sparkles,
  Droplet,
} from 'lucide-react';
import PwaNumpadDrawer from './PwaNumpadDrawer';

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
  const [numpadProduct, setNumpadProduct] = useState<{ product: Product; unitPrice: number } | null>(null);

  // Determine applicable price based on customer type
  const getProductPrice = (p: Product) => {
    if (activeCustomer.type === 'Đội xe') return p.priceFleet;
    if (activeCustomer.type === 'Thợ') return p.priceMechanic;
    return p.priceDealer;
  };

  // Filter products by category and search
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      // Category filter
      if (selectedCat === 'engine' && !p.category.toLowerCase().includes('động cơ') && !p.category.toLowerCase().includes('diesel') && !p.category.toLowerCase().includes('xăng')) return false;
      if (selectedCat === 'gear' && !p.category.toLowerCase().includes('hộp số') && !p.category.toLowerCase().includes('cầu')) return false;
      if (selectedCat === 'hydraulic' && !p.category.toLowerCase().includes('thủy lực')) return false;
      if (selectedCat === 'coolant' && !p.category.toLowerCase().includes('mát') && !p.category.toLowerCase().includes('nước')) return false;
      if (selectedCat === 'additive' && !p.category.toLowerCase().includes('phụ gia')) return false;

      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchName = p.name.toLowerCase().includes(query);
        const matchSku = p.sku.toLowerCase().includes(query);
        const matchViscosity = p.viscosity.toLowerCase().includes(query);
        return matchName || matchSku || matchViscosity;
      }

      return true;
    });
  }, [products, selectedCat, searchQuery]);

  // Cart summary calculations
  const { totalItems, totalCartValue } = useMemo(() => {
    let itemsCount = 0;
    let sum = 0;
    Object.entries(cart).forEach(([prodId, qty]) => {
      if (qty > 0) {
        itemsCount += qty;
        const prod = products.find((p) => p.id === prodId);
        if (prod) {
          sum += qty * getProductPrice(prod);
        }
      }
    });
    return { totalItems: itemsCount, totalCartValue: sum };
  }, [cart, products, activeCustomer]);

  const handleStepQty = (productId: string, delta: number) => {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(15);
      } catch {}
    }
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

        {/* Quick Search Bar */}
        <div className="p-3.5 pb-2 w-full">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm mã nhớt, SKU, 15W-40, VG 68, Castrol, Shell, Motul..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-12 pl-10 pr-4 rounded-xl bg-slate-100 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/50 border border-slate-200"
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

      {/* Product List Canvas - Responsive Multi-Column Grid */}
      <div className="p-4 sm:p-5 w-full grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredProducts.length === 0 ? (
          <div className="col-span-full py-16 text-center text-slate-400 text-sm font-medium">
            Không tìm thấy sản phẩm phù hợp với từ khóa
          </div>
        ) : (
          filteredProducts.map((product) => {
            const unitPrice = getProductPrice(product);
            const inCartQty = cart[product.id] || 0;
            const isLowStock = product.stock <= product.minSafeStock;

            // Thumbnail background color based on packaging
            let badgeBg = 'bg-amber-500 text-slate-950';
            if (product.packageType === 'Phuy 200L') badgeBg = 'bg-sky-600 text-white';
            else if (product.packageType === 'Thùng 18L') badgeBg = 'bg-amber-500 text-slate-950';
            else if (product.packageType === 'Xô 4L') badgeBg = 'bg-emerald-600 text-white';

            return (
              <div
                key={product.id}
                id={`pwa-product-card-${product.id}`}
                className={`bg-white rounded-2xl border p-4 shadow-2xs transition-all flex items-center justify-between gap-3.5 ${
                  inCartQty > 0 ? 'border-amber-400 ring-2 ring-amber-400/30' : 'border-slate-200'
                }`}
              >
                {/* 68x68 Thumbnail with Package Badge Overlay */}
                <div className="relative w-16 h-16 sm:w-18 sm:h-18 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 overflow-hidden shadow-2xs">
                  <Droplet
                    className={`w-8 h-8 ${
                      product.packageType === 'Phuy 200L'
                        ? 'text-sky-600'
                        : product.packageType === 'Thùng 18L'
                        ? 'text-amber-500'
                        : 'text-emerald-600'
                    }`}
                  />
                  <div
                    className={`absolute bottom-0 inset-x-0 text-[9px] font-black font-mono text-center py-0.5 uppercase tracking-tighter ${badgeBg}`}
                  >
                    {product.packageType}
                  </div>
                </div>

                {/* Center Info: Trade Name, Viscosity & Spec, Tier Price, Stock */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                      {product.sku}
                    </span>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-800 text-amber-300 font-mono">
                      {product.viscosity}
                    </span>
                    {product.drumReturnable && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-sky-100 text-sky-800">
                        Thu hồi vỏ
                      </span>
                    )}
                  </div>

                  <h4 className="font-extrabold text-slate-900 text-sm sm:text-base mt-1.5 leading-snug line-clamp-1">
                    {product.name}
                  </h4>

                  {/* Pricing */}
                  <div className="text-sm sm:text-base font-mono font-black text-amber-700 mt-1">
                    {formatVND(unitPrice)} <span className="text-xs text-slate-500 font-medium">/ {product.unit}</span>
                  </div>

                  {/* Stock Indicator */}
                  <div className="text-xs mt-0.5">
                    {isLowStock ? (
                      <span className="text-rose-600 font-bold">
                        Sắp hết hàng &bull; Còn {product.stock} {product.unit}
                      </span>
                    ) : (
                      <span className="text-emerald-600 font-medium">
                        Còn {product.stock} tại Kho Tổng
                      </span>
                    )}
                  </div>
                </div>

                {/* Right: Tactile Stepper (Min 44x44 / 48px tap targets with active scale depression) */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => handleStepQty(product.id, -1)}
                    disabled={inCartQty === 0}
                    className={`w-11 h-11 min-h-[44px] min-w-[44px] rounded-xl flex items-center justify-center font-bold text-base active:scale-90 transition-transform ${
                      inCartQty > 0
                        ? 'bg-slate-100 hover:bg-slate-200 text-slate-900 cursor-pointer'
                        : 'bg-slate-50 text-slate-300 cursor-not-allowed'
                    }`}
                    title="Giảm số lượng"
                  >
                    <Minus className="w-4 h-4" />
                  </button>

                  {/* Center Tap-to-Numpad Trigger */}
                  <button
                    onClick={() => setNumpadProduct({ product, unitPrice })}
                    className="w-11 h-11 flex flex-col items-center justify-center text-center font-mono font-black text-base text-slate-900 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                    title="Nhấn để mở bàn phím số lượng lớn"
                  >
                    <span>{inCartQty}</span>
                    <span className="text-[9px] text-slate-400 font-sans leading-none">chạm sửa</span>
                  </button>

                  <button
                    onClick={() => handleStepQty(product.id, 1)}
                    className="w-11 h-11 min-h-[44px] min-w-[44px] rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-90 text-slate-950 font-bold flex items-center justify-center text-base shadow-sm transition-transform cursor-pointer"
                    title="Tăng số lượng"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Persistent Floating Cart Strip */}
      {totalItems > 0 && (
        <div
          id="pwa-floating-cart-strip"
          className="fixed bottom-4 left-0 right-0 z-30 px-4 pointer-events-none"
        >
          <div className="max-w-2xl mx-auto bg-slate-900 text-white rounded-2xl shadow-2xl p-4 sm:p-5 flex items-center justify-between gap-4 border border-slate-700 pointer-events-auto animate-in slide-in-from-bottom duration-200">
            {/* Left: Item Counter & Sum */}
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-amber-500 text-slate-950 font-mono font-black text-base flex items-center justify-center shrink-0">
                {totalItems}
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
    </div>
  );
}
