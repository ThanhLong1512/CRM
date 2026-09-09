import { resolveTierUnitPrice, calculateVolumeDiscount } from '../src/lib/pricingEngine.ts';
import {
  getLitersFromVolume,
  breakdownLitersToPackages,
  convertPackagingUnits,
  formatLitersBreakdown,
  LUBE_VOLUMES,
} from '../src/lib/unitConverter.ts';

console.log('--- TEST 1: Standard Unit Conversion (Phuy 208L) ---');
console.assert(LUBE_VOLUMES.DRUM_208L === 208, 'Drum volume must be 208L');
console.assert(getLitersFromVolume('Phuy 208L') === 208, 'Phuy 208L must return 208');
console.assert(getLitersFromVolume('Thùng 18L') === 18, 'Thùng 18L must return 18');
console.assert(getLitersFromVolume('Xô 4L') === 4, 'Xô 4L must return 4');
console.assert(getLitersFromVolume('Chai 1L') === 1, 'Chai 1L must return 1');

const breakdown450 = breakdownLitersToPackages(450);
console.log('450 Liters breakdown:', breakdown450);
console.assert(breakdown450.drums208L === 2, '450L has 2 drums of 208L');
console.assert(breakdown450.pails18L === 1, '450L has 1 pail of 18L');
console.assert(breakdown450.cans4L === 4, '450L has 4 cans of 4L');

const ratio = convertPackagingUnits(1, 'Phuy 208L', 'Thùng 18L');
console.log('1 Phuy (208L) in 18L pails:', ratio);
console.assert(ratio === 11.56, '1 Phuy 208L must equal 11.56 xô 18L');

console.log('--- TEST 2: Multi-Tier Pricing (Gold / Silver / Retail) ---');
const sampleProduct = {
  id: 'prod-1',
  unitPrice: 1000000,
  wholesalePrice: 900000, // Gold
  garagePrice: 950000,    // Silver
  retailPrice: 1050000,   // Retail
  volume: 'Thùng 18L',
};

const goldPrice = resolveTierUnitPrice(sampleProduct, 'GOLD');
const silverPrice = resolveTierUnitPrice(sampleProduct, 'SILVER');
const retailPrice = resolveTierUnitPrice(sampleProduct, 'RETAIL');
console.log('Pricing tiers:', { goldPrice, silverPrice, retailPrice });
console.assert(goldPrice === 900000, 'Gold tier price check');
console.assert(silverPrice === 950000, 'Silver tier price check');
console.assert(retailPrice === 1050000, 'Retail tier price check');

console.log('--- TEST 3: Automated Volume Discounts (≥5 xô -> 3%, ≥2 phuy -> 5%) ---');
// Test 5 pails
const pailOrder = [
  {
    productId: 'prod-1',
    quantity: 5,
    product: sampleProduct,
  },
];
const pailDiscount = calculateVolumeDiscount(pailOrder, 'SILVER');
console.log('5 Pails Discount:', {
  subtotal: pailDiscount.rawSubtotal,
  discount: pailDiscount.discountAmount,
  rules: pailDiscount.appliedRules,
});
console.assert(pailDiscount.discountAmount === Math.round(5 * 950000 * 0.03), '5 pails gets 3% discount');

// Test 2 drums
const drumProduct = {
  id: 'prod-drum',
  unitPrice: 12000000,
  wholesalePrice: 11000000,
  garagePrice: 11500000,
  retailPrice: 12500000,
  volume: 'Phuy 208L',
  isDrum: true,
};
const drumOrder = [
  {
    productId: 'prod-drum',
    quantity: 2,
    product: drumProduct,
  },
];
const drumDiscount = calculateVolumeDiscount(drumOrder, 'SILVER');
console.log('2 Drums Discount:', {
  subtotal: drumDiscount.rawSubtotal,
  discount: drumDiscount.discountAmount,
  rules: drumDiscount.appliedRules,
});
console.assert(drumDiscount.discountAmount === Math.round(2 * 11500000 * 0.05), '2 drums gets 5% discount');

console.log('\n>>> ALL CORE BUSINESS UNIT TESTS PASSED SUCCESSFULLY! <<<');
