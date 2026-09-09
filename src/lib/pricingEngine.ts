import { LUBE_VOLUMES, getLitersFromVolume } from './unitConverter';

export type CustomerDealerTier = 'GOLD' | 'SILVER' | 'RETAIL';

export interface ProductPricingData {
  id: string;
  unitPrice?: number;
  priceDealer?: number;
  priceMechanic?: number;
  priceFleet?: number;
  wholesalePrice?: number | null; // Tier Gold (NPP)
  garagePrice?: number | null;    // Tier Silver (Garage)
  retailPrice?: number | null;    // Tier Retail (Thợ máy)
  volume?: string | null;
  packageType?: string | null;
  isDrum?: boolean;
}

export interface CartItemForPricing {
  productId?: string;
  quantity: number;
  product: ProductPricingData;
}

export interface VolumeDiscountResult {
  rawSubtotal: number;
  discountAmount: number;
  discountPercent: number;
  netTotal: number;
  pailCount: number;
  drumCount: number;
  appliedRules: string[];
  badges: string[];
}

/**
 * Resolves the unit price based on customer dealer tier:
 * - GOLD: Uses wholesalePrice if available, or 8% off standard
 * - SILVER: Uses garagePrice if available, or standard unitPrice
 * - RETAIL: Uses retailPrice if available, or standard unitPrice * 1.05
 */
export function resolveTierUnitPrice(
  product: ProductPricingData,
  tier: CustomerDealerTier = 'SILVER'
): number {
  const basePrice = Number(
    product.unitPrice ??
    product.garagePrice ??
    product.priceDealer ??
    product.priceMechanic ??
    0
  );

  if (tier === 'GOLD') {
    if (product.wholesalePrice != null && Number(product.wholesalePrice) > 0) {
      return Number(product.wholesalePrice);
    }
    return Math.round(basePrice * 0.92); // 8% wholesale discount
  }

  if (tier === 'RETAIL') {
    if (product.retailPrice != null && Number(product.retailPrice) > 0) {
      return Number(product.retailPrice);
    }
    return Math.round(basePrice * 1.05); // 5% retail markup
  }

  // Default SILVER (Garage)
  if (product.garagePrice != null && Number(product.garagePrice) > 0) {
    return Number(product.garagePrice);
  }
  return basePrice;
}

export const resolveTierPrice = resolveTierUnitPrice;

/**
 * Calculates automated volume discounts based on order item quantities:
 * - Rule 1: >= 5 pails/buckets (18L - 20L) -> Auto 3% discount
 * - Rule 2: >= 2 drums (208L) -> Auto 5% discount
 * - Tier Gold extra bonus: 1% volume bonus
 */
export function calculateVolumeDiscount(
  items: CartItemForPricing[],
  customerTier: CustomerDealerTier = 'SILVER',
  manualDiscountPercent: number = 0
): VolumeDiscountResult {
  let rawSubtotal = 0;
  let drumSubtotal = 0;
  let pailSubtotal = 0;
  let drumCount = 0;
  let pailCount = 0;

  for (const item of items) {
    const unitPrice = resolveTierUnitPrice(item.product, customerTier);
    const itemSubtotal = item.quantity * unitPrice;
    rawSubtotal += itemSubtotal;

    const volumeStr = item.product.volume || item.product.packageType;
    const isDrum = Boolean(item.product.isDrum || (item.product.packageType && item.product.packageType.includes('Phuy')));
    const liters = getLitersFromVolume(volumeStr, isDrum);
    if (isDrum || liters >= 150) {
      drumCount += item.quantity;
      drumSubtotal += itemSubtotal;
    } else if (liters >= 10) {
      pailCount += item.quantity;
      pailSubtotal += itemSubtotal;
    }
  }

  const appliedRules: string[] = [];
  let autoDiscountAmount = 0;

  // Rule: >= 2 Phuy 208L -> 5% on drum subtotal
  if (drumCount >= 2) {
    const drumDisc = Math.round(drumSubtotal * 0.05);
    autoDiscountAmount += drumDisc;
    appliedRules.push(`Đạt mốc ${drumCount} phuy (≥2 phuy): Tự động giảm 5% (${drumDisc.toLocaleString('vi-VN')} đ)`);
  }

  // Rule: >= 5 Xô/Thùng 18L -> 3% on pail subtotal
  if (pailCount >= 5) {
    const pailDisc = Math.round(pailSubtotal * 0.03);
    autoDiscountAmount += pailDisc;
    appliedRules.push(`Đạt mốc ${pailCount} xô (≥5 xô): Tự động giảm 3% (${pailDisc.toLocaleString('vi-VN')} đ)`);
  }

  // If customer Tier is GOLD, grant an extra 1% enterprise bonus on entire order
  if (customerTier === 'GOLD' && (drumCount > 0 || pailCount > 0)) {
    const goldBonus = Math.round(rawSubtotal * 0.01);
    autoDiscountAmount += goldBonus;
    appliedRules.push(`Ưu đãi Đại lý Vàng (Gold Partner): Thêm 1% (${goldBonus.toLocaleString('vi-VN')} đ)`);
  }

  // Manual discount overlay if higher
  let finalDiscountAmount = autoDiscountAmount;
  if (manualDiscountPercent > 0) {
    const manualAmount = Math.round((rawSubtotal * manualDiscountPercent) / 100);
    if (manualAmount > finalDiscountAmount) {
      finalDiscountAmount = manualAmount;
      appliedRules.push(`Áp dụng chiết khấu đặc biệt theo thoả thuận: ${manualDiscountPercent}%`);
    }
  }

  finalDiscountAmount = Math.min(rawSubtotal, finalDiscountAmount);
  const effectivePercent = rawSubtotal > 0 ? Math.round((finalDiscountAmount / rawSubtotal) * 1000) / 10 : 0;

  return {
    rawSubtotal,
    discountAmount: finalDiscountAmount,
    discountPercent: effectivePercent,
    netTotal: Math.max(0, rawSubtotal - finalDiscountAmount),
    pailCount,
    drumCount,
    appliedRules,
    badges: appliedRules,
  };
}
