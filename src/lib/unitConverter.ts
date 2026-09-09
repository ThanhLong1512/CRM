/**
 * Standard Lubricant Oil Packaging & Volume Conversion Engine
 * Conforms to international industrial lubricant standards:
 * - Steel Drum = 208 Liters (55 US Gallons)
 * - Industrial Pail / Bucket = 18 Liters (standard lube pail)
 * - Engine Oil Can / Jug = 4 Liters
 * - Bottle / Pack = 1 Liter
 */

export const LUBE_VOLUMES = {
  DRUM_208L: 208,
  PAIL_18L: 18,
  CAN_4L: 4,
  BOTTLE_1L: 1,
} as const;

export type StandardPackaging = 'Phuy 208L' | 'Thùng 18L' | 'Xô 4L' | 'Chai 1L';

/**
 * Returns exact volume in liters for any package type label or volume string
 */
export function getLitersFromVolume(volumeStr?: string | null, isDrum?: boolean): number {
  if (isDrum) return LUBE_VOLUMES.DRUM_208L;
  if (!volumeStr) return 1;

  const lower = volumeStr.toLowerCase().trim();
  if (lower.includes('208') || lower.includes('phuy')) return LUBE_VOLUMES.DRUM_208L;
  if (lower.includes('200')) return LUBE_VOLUMES.DRUM_208L; // legacy 200L migrated to standard 208L
  if (lower.includes('18') || lower.includes('20') || lower.includes('xô 18') || lower.includes('thùng 18')) {
    return LUBE_VOLUMES.PAIL_18L;
  }
  if (lower.includes('4') || lower.includes('can 4') || lower.includes('xô 4')) {
    return LUBE_VOLUMES.CAN_4L;
  }
  if (lower.includes('1') || lower.includes('chai 1')) {
    return LUBE_VOLUMES.BOTTLE_1L;
  }

  const parsed = parseFloat(lower.replace(/[^\d.]/g, ''));
  if (Number.isFinite(parsed) && parsed > 0) {
    return parsed;
  }
  return 1;
}

export const getContainerLiters = (volumeStr?: string | null, isDrum?: boolean): number =>
  getLitersFromVolume(volumeStr, isDrum);

/**
 * Categorize a product or volume into standard packaging
 */
export function normalizePackagingType(volumeStr?: string | null, isDrum?: boolean): StandardPackaging {
  const liters = getLitersFromVolume(volumeStr, isDrum);
  if (liters >= 150) return 'Phuy 208L';
  if (liters >= 10) return 'Thùng 18L';
  if (liters >= 3) return 'Xô 4L';
  return 'Chai 1L';
}

/**
 * Convert any volume in Liters into an optimized packaging breakdown:
 * e.g. 450 Liters = 2 Phuy (416L) + 1 Thùng (18L) + 4 Can (16L)
 */
export function breakdownLitersToPackages(totalLiters: number): {
  drums208L: number;
  pails18L: number;
  cans4L: number;
  bottles1L: number;
  remainderLiters: number;
} {
  let remaining = Math.max(0, totalLiters);

  const drums208L = Math.floor(remaining / LUBE_VOLUMES.DRUM_208L);
  remaining -= drums208L * LUBE_VOLUMES.DRUM_208L;

  const pails18L = Math.floor(remaining / LUBE_VOLUMES.PAIL_18L);
  remaining -= pails18L * LUBE_VOLUMES.PAIL_18L;

  const cans4L = Math.floor(remaining / LUBE_VOLUMES.CAN_4L);
  remaining -= cans4L * LUBE_VOLUMES.CAN_4L;

  const bottles1L = Math.floor(remaining / LUBE_VOLUMES.BOTTLE_1L);
  remaining -= bottles1L * LUBE_VOLUMES.BOTTLE_1L;

  return {
    drums208L,
    pails18L,
    cans4L,
    bottles1L,
    remainderLiters: Math.round(remaining * 100) / 100,
  };
}

/**
 * Format packaging breakdown into a human-readable string
 */
export function formatLitersBreakdown(totalLiters: number): string {
  const b = breakdownLitersToPackages(totalLiters);
  const parts: string[] = [];
  if (b.drums208L > 0) parts.push(`${b.drums208L} phuy (208L)`);
  if (b.pails18L > 0) parts.push(`${b.pails18L} xô (18L)`);
  if (b.cans4L > 0) parts.push(`${b.cans4L} can (4L)`);
  if (b.bottles1L > 0) parts.push(`${b.bottles1L} chai (1L)`);
  if (b.remainderLiters > 0) parts.push(`${b.remainderLiters} L lẻ`);
  return parts.join(' + ') || `${totalLiters} L`;
}

/**
 * 2-way converter between packaging units:
 * e.g. 1 Phuy (208L) = 11.55 Xô (18L) = 52 Can (4L) = 208 Chai (1L)
 */
export function convertPackagingUnits(
  quantity: number,
  fromUnit: StandardPackaging,
  toUnit: StandardPackaging
): number {
  const fromLiters =
    fromUnit === 'Phuy 208L'
      ? LUBE_VOLUMES.DRUM_208L
      : fromUnit === 'Thùng 18L'
      ? LUBE_VOLUMES.PAIL_18L
      : fromUnit === 'Xô 4L'
      ? LUBE_VOLUMES.CAN_4L
      : LUBE_VOLUMES.BOTTLE_1L;

  const toLiters =
    toUnit === 'Phuy 208L'
      ? LUBE_VOLUMES.DRUM_208L
      : toUnit === 'Thùng 18L'
      ? LUBE_VOLUMES.PAIL_18L
      : toUnit === 'Xô 4L'
      ? LUBE_VOLUMES.CAN_4L
      : LUBE_VOLUMES.BOTTLE_1L;

  return Math.round(((quantity * fromLiters) / toLiters) * 100) / 100;
}
