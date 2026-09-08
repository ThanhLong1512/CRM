"use client";
import { useState, useMemo, FormEvent } from 'react';
import { Product, PackageType } from '../types';
import { formatVND } from '@/lib/remix/mappers';
import {
  Boxes,
  Plus,
  Search,
  Filter,
  AlertTriangle,
  Package,
  Layers,
  CheckCircle2,
  X,
  Edit2,
  Trash2,
  TrendingUp,
  Tag,
  ShieldCheck,
  Droplets,
  Building2,
  Wrench,
  Truck,
  ArrowUpDown,
  BookOpen,
} from 'lucide-react';
import LubeGuideModal from './LubeGuideModal';

interface ProductsViewProps {
  products: Product[];
  onAddProduct: (product: Product) => void;
  onDeleteProduct: (productId: string) => void;
  onUpdateProduct: (product: Product) => void;
}

type SlimForm = {
  name: string;
  sku: string;
  packageType: PackageType;
  viscosity: string;
  standards: string;
  drumReturnable: boolean;
  priceDealer: number;
  stock: number;
};

const emptyForm = (): SlimForm => ({
  name: '',
  sku: `DN-${Date.now().toString().slice(-4)}`,
  packageType: 'Thùng 18L',
  viscosity: '',
  standards: '',
  drumReturnable: false,
  priceDealer: 0,
  stock: 0,
});

export default function ProductsView({
  products,
  onAddProduct,
  onDeleteProduct,
  onUpdateProduct,
}: ProductsViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedPackage, setSelectedPackage] = useState<string>('all');

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState<SlimForm>(emptyForm);

  const [stockAdjustModal, setStockAdjustModal] = useState<{
    product: Product;
    delta: number;
  } | null>(null);
  const [showLubeGuide, setShowLubeGuide] = useState(false);

  const totalSKUs = products.length;
  const drumStockCount = products
    .filter((p) => p.packageType === 'Phuy 200L')
    .reduce((sum, p) => sum + p.stock, 0);
  const smallPackageStockCount = products
    .filter((p) => p.packageType !== 'Phuy 200L')
    .reduce((sum, p) => sum + p.stock, 0);
  const lowStockProducts = products.filter((p) => p.stock <= (p.minSafeStock || 5));

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchSearch =
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.viscosity || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchCategory =
        selectedCategory === 'all' || p.category === selectedCategory;
      const matchPackage =
        selectedPackage === 'all' || p.packageType === selectedPackage;
      return matchSearch && matchCategory && matchPackage;
    });
  }, [products, searchTerm, selectedCategory, selectedPackage]);

  const handleOpenDrawer = (productToEdit?: Product) => {
    if (productToEdit) {
      setEditingProduct(productToEdit);
      setFormData({
        name: productToEdit.name,
        sku: productToEdit.sku,
        packageType: productToEdit.packageType,
        viscosity: productToEdit.viscosity || '',
        standards: productToEdit.standards || '',
        drumReturnable: !!productToEdit.drumReturnable,
        priceDealer: productToEdit.priceDealer,
        stock: productToEdit.stock,
      });
    } else {
      setEditingProduct(null);
      setFormData(emptyForm());
    }
    setIsDrawerOpen(true);
  };

  const handleSaveProduct = (e: FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.sku.trim()) return;

    const unit =
      formData.packageType === 'Phuy 200L'
        ? 'Phuy (200L)'
        : formData.packageType === 'Thùng 18L'
          ? 'Thùng (18L)'
          : formData.packageType === 'Xô 4L'
            ? 'Can (4L)'
            : 'Chai (1L)';

    if (editingProduct) {
      onUpdateProduct({
        ...editingProduct,
        ...formData,
        unit,
        priceMechanic: formData.priceDealer,
        priceFleet: formData.priceDealer,
      });
    } else {
      const newProduct: Product = {
        id: `local-${Date.now()}`,
        ...formData,
        unit,
        brand: '',
        category: '',
        baseOil: 'Khoáng',
        priceMechanic: formData.priceDealer,
        priceFleet: formData.priceDealer,
        minSafeStock: 5,
        maxStock: Math.max(formData.stock, 100),
        vatPercent: 10,
        isForSale: true,
      };
      onAddProduct(newProduct);
    }
    setIsDrawerOpen(false);
  };

  const handleStockAdjustmentConfirm = () => {
    if (!stockAdjustModal) return;
    const { product, delta } = stockAdjustModal;
    const newStock = Math.max(0, product.stock + delta);
    onUpdateProduct({
      ...product,
      stock: newStock,
    });
    setStockAdjustModal(null);
  };

  // Helper for color coding package types
  const getPackageBadge = (pkg: PackageType) => {
    switch (pkg) {
      case 'Phuy 200L':
        return {
          bg: 'bg-cyan-50 text-cyan-800 border-cyan-300',
          dot: 'bg-cyan-600',
          icon: '🛢️',
        };
      case 'Thùng 18L':
        return {
          bg: 'bg-amber-50 text-amber-800 border-amber-300',
          dot: 'bg-amber-600',
          icon: '📦',
        };
      case 'Xô 4L':
        return {
          bg: 'bg-orange-50 text-orange-800 border-orange-300',
          dot: 'bg-orange-600',
          icon: '🪣',
        };
      default:
        return {
          bg: 'bg-slate-100 text-slate-800 border-slate-300',
          dot: 'bg-slate-600',
          icon: '🧴',
        };
    }
  };

  return (
    <div id="products-view" className="w-full space-y-6">
      {/* 1. Header & Actions */}
      <div className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs sm:flex-row sm:items-center">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-extrabold tracking-tight text-slate-900 sm:text-2xl">
              Master Data Sản Phẩm &amp; Kho Dầu Nhớt
            </h2>
            <span className="rounded-full border border-amber-300 bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-900">
              Đa tầng quy cách
            </span>
          </div>
          <p className="mt-0.5 text-xs text-slate-500">
            Quản lý thông số kỹ thuật (SAE/API), chính sách giá 3 cấp (Đại lý, Thợ, Fleet) và định mức tồn kho an toàn
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setShowLubeGuide(true)}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-bold text-slate-800 shadow-xs transition-all hover:bg-slate-50 cursor-pointer"
          >
            <BookOpen className="w-4 h-4 text-amber-600" />
            <span>Tra Cứu Lube Guide &amp; Đổi Mã Nhớt</span>
          </button>
          <button
            id="btn-add-product"
            onClick={() => handleOpenDrawer()}
            className="inline-flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-xs font-bold text-slate-950 shadow-xs transition-all hover:bg-amber-600 hover:shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm Sản Phẩm Mới</span>
          </button>
        </div>
      </div>

      {/* 2. KPI Summary 4 Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1 */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Tổng SKU Đang Bán</span>
            <Boxes className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-900 font-mono">
              {totalSKUs}
            </span>
            <span className="text-[11px] text-emerald-600 font-semibold flex items-center">
              <CheckCircle2 className="w-3 h-3 mr-0.5" /> 100% Hoạt động
            </span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Phủ 5 nhóm nhớt động cơ &amp; công nghiệp</div>
        </div>

        {/* KPI 2 */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Tồn Kho Phuy Sắt 200L</span>
            <span className="text-sm">🛢️</span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-cyan-900 font-mono">
              {drumStockCount}
            </span>
            <span className="text-xs text-slate-500 font-medium">phuy trong kho</span>
          </div>
          <div className="text-[11px] text-cyan-700 font-medium mt-1">
            Quy đổi: <strong>{drumStockCount * 200} Lít</strong> dung tích
          </div>
        </div>

        {/* KPI 3 */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Tồn Thùng/Xô/Can Lẻ</span>
            <Package className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-900 font-mono">
              {smallPackageStockCount}
            </span>
            <span className="text-xs text-slate-500 font-medium">đơn vị đóng gói</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Bao gồm xô 18L, can 4L, chai 1L</div>
        </div>

        {/* KPI 4 */}
        <div
          className={`p-4 rounded-xl border shadow-xs hover:shadow-md transition-shadow ${
            lowStockProducts.length > 0
              ? 'bg-rose-50/70 border-rose-200 text-rose-900'
              : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-medium">
            <span className={lowStockProducts.length > 0 ? 'text-rose-800' : 'text-slate-500'}>
              Cảnh Báo Chạm Mức An Toàn
            </span>
            <AlertTriangle
              className={`w-4 h-4 ${
                lowStockProducts.length > 0 ? 'text-rose-600 animate-bounce' : 'text-slate-400'
              }`}
            />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span
              className={`text-2xl font-extrabold font-mono ${
                lowStockProducts.length > 0 ? 'text-rose-700' : 'text-slate-900'
              }`}
            >
              {lowStockProducts.length}
            </span>
            <span className="text-xs font-medium">SKU cần đặt hàng gấp</span>
          </div>
          <div className="text-[11px] text-rose-600 font-medium mt-1 truncate">
            {lowStockProducts.length > 0
              ? `Cần nhập: ${lowStockProducts[0].name.slice(0, 24)}...`
              : 'Tồn kho trên định mức an toàn'}
          </div>
        </div>
      </div>

      {/* 3. Search & Category Filters Toolbar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 flex-1 min-w-[280px]">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm theo tên sản phẩm, mã SKU, thương hiệu (Castrol, Shell...), cấp nhớt 15W-40..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs placeholder:text-slate-400 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 bg-white focus:outline-none focus:border-amber-500 cursor-pointer"
          >
            <option value="all">Tất cả danh mục nhớt</option>
            <option value="Dầu động cơ diesel">Dầu động cơ diesel</option>
            <option value="Dầu động cơ xăng">Dầu động cơ xăng</option>
            <option value="Dầu thủy lực công nghiệp">Dầu thủy lực công nghiệp</option>
            <option value="Dầu hộp số & cầu">Dầu hộp số &amp; cầu</option>
            <option value="Dầu động cơ xe máy">Dầu động cơ xe máy</option>
            <option value="Nước làm mát & phụ gia">Nước làm mát &amp; phụ gia</option>
          </select>

          {/* Package Filter */}
          <select
            value={selectedPackage}
            onChange={(e) => setSelectedPackage(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 bg-white focus:outline-none focus:border-amber-500 cursor-pointer"
          >
            <option value="all">Tất cả quy cách</option>
            <option value="Phuy 200L">Phuy 200L (Vỏ sắt hoàn trả)</option>
            <option value="Thùng 18L">Thùng 18L / Xô</option>
            <option value="Xô 4L">Xô / Can 4L</option>
            <option value="Chai 1L">Chai 1L</option>
          </select>
        </div>
      </div>

      {/* 4. Professional Data Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/90 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Sản Phẩm &amp; SKU</th>
                <th className="py-3 px-4">Cấp Nhớt &amp; Tiêu Chuẩn</th>
                <th className="py-3 px-4">Quy Cách Đóng Gói</th>
                <th className="py-3 px-4">
                  <div className="flex items-center gap-1">
                    <span>Bảng Giá 3 Cấp (VNĐ)</span>
                    <span className="text-[10px] lowercase text-slate-400 font-normal">
                      (Đại lý / Thợ / Fleet)
                    </span>
                  </div>
                </th>
                <th className="py-3 px-4">Tồn Kho Thực Tế</th>
                <th className="py-3 px-4 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredProducts.map((p) => {
                const pkgBadge = getPackageBadge(p.packageType);
                const isLowStock = p.stock <= p.minSafeStock;
                const stockPercent = Math.min(
                  100,
                  Math.round((p.stock / (p.maxStock || 100)) * 100)
                );

                return (
                  <tr
                    key={p.id}
                    id={`product-row-${p.id}`}
                    className="hover:bg-slate-50/80 transition-colors group"
                  >
                    {/* Col 1: Product info */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-slate-100 to-slate-200 border border-slate-200 flex items-center justify-center shrink-0 text-base shadow-2xs">
                          {pkgBadge.icon}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-mono text-[11px] font-bold px-1.5 py-0.2 bg-slate-100 text-slate-700 rounded border border-slate-200">
                              {p.sku}
                            </span>
                            <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                              {p.brand}
                            </span>
                            {p.drumReturnable && (
                              <span className="text-[10px] font-semibold text-cyan-800 bg-cyan-50 px-1.5 py-0.2 rounded border border-cyan-200">
                                Thế chân vỏ
                              </span>
                            )}
                          </div>
                          <div className="font-semibold text-slate-900 mt-0.5 leading-snug">
                            {p.name}
                          </div>
                          <div className="text-[11px] text-slate-400">{p.category}</div>
                        </div>
                      </div>
                    </td>

                    {/* Col 2: Technical Specs */}
                    <td className="py-3.5 px-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                            {p.viscosity}
                          </span>
                          <span className="text-[11px] text-slate-600 font-medium">
                            {p.baseOil}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono truncate max-w-[200px]">
                          {p.standards}
                        </div>
                      </div>
                    </td>

                    {/* Col 3: Packaging Type */}
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${pkgBadge.bg}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${pkgBadge.dot}`} />
                        <span>{p.packageType}</span>
                      </span>
                    </td>

                    {/* Col 4: Multi-tier Pricing Matrix */}
                    <td className="py-3.5 px-4 font-mono">
                      <div className="space-y-0.5 text-[11px]">
                        <div className="flex items-center justify-between gap-2 text-slate-700">
                          <span className="text-slate-400 font-sans flex items-center gap-1">
                            <Building2 className="w-3 h-3 text-amber-600" /> Đại lý:
                          </span>
                          <span className="font-bold text-slate-900">
                            {formatVND(p.priceDealer)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-2 text-slate-700">
                          <span className="text-slate-400 font-sans flex items-center gap-1">
                            <Wrench className="w-3 h-3 text-purple-600" /> Thợ máy:
                          </span>
                          <span className="font-semibold text-purple-900">
                            {formatVND(p.priceMechanic)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-2 text-slate-700">
                          <span className="text-slate-400 font-sans flex items-center gap-1">
                            <Truck className="w-3 h-3 text-blue-600" /> Fleet:
                          </span>
                          <span className="font-semibold text-blue-900">
                            {formatVND(p.priceFleet)}
                          </span>
                        </div>
                        {(() => {
                          const liters =
                            p.packageType === "Phuy 200L"
                              ? 200
                              : p.packageType === "Thùng 18L"
                              ? 18
                              : p.packageType === "Xô 4L"
                              ? 4
                              : 1;
                          const perLiter = Math.round(p.priceDealer / liters);
                          return (
                            <div className="pt-1 border-t border-slate-100 flex items-center justify-between gap-2 text-[10px]">
                              <span className="text-slate-400 font-sans">Quy đổi Lít:</span>
                              <span className="font-extrabold text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200/80">
                                ~{formatVND(perLiter)}/L
                              </span>
                            </div>
                          );
                        })()}
                      </div>
                    </td>

                    {/* Col 5: Actual Stock & Progress Bar */}
                    <td className="py-3.5 px-4">
                      <div className="space-y-1.5 min-w-[130px]">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-mono font-bold text-slate-900 text-sm">
                            {p.stock} <span className="text-xs text-slate-500 font-normal">{p.unit.split(' ')[0]}</span>
                          </span>
                          {isLowStock ? (
                            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-rose-100 text-rose-700 border border-rose-200 animate-pulse">
                              Sắp cạn
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-400 font-mono">
                              An toàn: &gt;{p.minSafeStock}
                            </span>
                          )}
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              isLowStock
                                ? 'bg-rose-500'
                                : stockPercent < 40
                                ? 'bg-amber-500'
                                : 'bg-emerald-500'
                            }`}
                            style={{ width: `${Math.max(5, stockPercent)}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Col 6: Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Quick Stock Adjustment */}
                        <button
                          onClick={() => setStockAdjustModal({ product: p, delta: 10 })}
                          className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-medium transition-colors cursor-pointer"
                          title="Nhập thêm hàng nhanh"
                        >
                          + Nhập kho
                        </button>
                        <button
                          onClick={() => handleOpenDrawer(p)}
                          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
                          title="Chỉnh sửa sản phẩm"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Bạn có chắc muốn xóa sản phẩm ${p.name}?`)) {
                              onDeleteProduct(p.id);
                            }
                          }}
                          className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                          title="Xóa sản phẩm"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Sliding Drawer for Add/Edit Product */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
            onClick={() => setIsDrawerOpen(false)}
          />

          <div className="fixed inset-y-0 right-0 pl-10 max-w-full flex">
            <div className="w-screen max-w-2xl bg-white shadow-2xl flex flex-col">
              {/* Drawer Header */}
              <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    {editingProduct ? 'Chỉnh sửa sản phẩm' : 'Thêm sản phẩm'}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Chỉ các trường lưu DB: mã, tên, nhớt, tiêu chuẩn, quy cách, giá, tồn, vỏ phuy
                  </p>
                </div>
                <button
                  onClick={() => setIsDrawerOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-500 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveProduct} className="flex-1 overflow-y-auto p-6 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tên sản phẩm *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:border-amber-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Mã SKU *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.sku}
                      onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs font-mono font-bold focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Cấp độ nhớt
                    </label>
                    <input
                      type="text"
                      value={formData.viscosity}
                      onChange={(e) => setFormData({ ...formData, viscosity: e.target.value })}
                      placeholder="15W-40"
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs font-mono focus:border-amber-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tiêu chuẩn (API / ACEA)
                  </label>
                  <input
                    type="text"
                    value={formData.standards}
                    onChange={(e) => setFormData({ ...formData, standards: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Quy cách đóng gói
                  </label>
                  <select
                    value={formData.packageType}
                    onChange={(e) => {
                      const pkg = e.target.value as PackageType;
                      setFormData({
                        ...formData,
                        packageType: pkg,
                        drumReturnable: pkg === 'Phuy 200L',
                      });
                    }}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:border-amber-500"
                  >
                    <option value="Phuy 200L">Phuy 200L</option>
                    <option value="Thùng 18L">Thùng 18L</option>
                    <option value="Xô 4L">Xô 4L</option>
                    <option value="Chai 1L">Chai 1L</option>
                  </select>
                </div>
                <label className="flex items-center gap-2 text-xs text-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.drumReturnable}
                    onChange={(e) =>
                      setFormData({ ...formData, drumReturnable: e.target.checked })
                    }
                    className="rounded text-amber-600"
                  />
                  Sản phẩm gắn quản lý vỏ phuy (isDrum)
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Giá bán (VNĐ)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.priceDealer}
                      onChange={(e) =>
                        setFormData({ ...formData, priceDealer: Number(e.target.value) })
                      }
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs font-mono font-bold focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Tồn kho
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.stock}
                      onChange={(e) =>
                        setFormData({ ...formData, stock: Number(e.target.value) })
                      }
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs font-mono font-bold focus:border-amber-500"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsDrawerOpen(false)}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold cursor-pointer"
                  >
                    {editingProduct ? 'Lưu thay đổi' : 'Tạo sản phẩm'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Quick Stock Adjustment Modal */}
      {stockAdjustModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-xl max-w-sm w-full p-5 shadow-xl border border-slate-200 space-y-4">
            <h4 className="font-bold text-slate-900 text-sm">
              Nhập Hàng Nhanh Vào Kho
            </h4>
            <p className="text-xs text-slate-500">
              Sản phẩm: <strong>{stockAdjustModal.product.name}</strong> ({stockAdjustModal.product.sku})
            </p>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Số lượng nhập thêm ({stockAdjustModal.product.unit}):
              </label>
              <input
                type="number"
                min="1"
                value={stockAdjustModal.delta}
                onChange={(e) =>
                  setStockAdjustModal({
                    ...stockAdjustModal,
                    delta: Number(e.target.value),
                  })
                }
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm font-mono font-bold"
              />
              <div className="text-[11px] text-slate-500 mt-1">
                Tồn hiện tại: <strong>{stockAdjustModal.product.stock}</strong> &rarr; Sau nhập:{' '}
                <strong>{stockAdjustModal.product.stock + stockAdjustModal.delta}</strong>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setStockAdjustModal(null)}
                className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Đóng
              </button>
              <button
                onClick={handleStockAdjustmentConfirm}
                className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
              >
                Xác Nhận Nhập
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lube Guide & Cross Reference Modal */}
      <LubeGuideModal
        isOpen={showLubeGuide}
        onClose={() => setShowLubeGuide(false)}
        onSelectProductSku={(sku) => {
          setSearchTerm(sku);
          setShowLubeGuide(false);
        }}
      />
    </div>
  );
}
