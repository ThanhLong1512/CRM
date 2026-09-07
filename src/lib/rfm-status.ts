export const RFM_WINDOW_DAYS = 180;

export type RfmSegment =
  | "VIP"
  | "CHURN_RISK"
  | "POTENTIAL"
  | "NEW_LOW"
  | "STABLE";

export type RfmScores = {
  r: number;
  f: number;
  m: number;
};

export const RFM_SEGMENTS: RfmSegment[] = [
  "VIP",
  "CHURN_RISK",
  "POTENTIAL",
  "NEW_LOW",
  "STABLE",
];

export function rfmSegmentLabel(segment: RfmSegment): string {
  switch (segment) {
    case "VIP":
      return "VIP";
    case "CHURN_RISK":
      return "Nguy cơ rời bỏ";
    case "POTENTIAL":
      return "Tiềm năng";
    case "NEW_LOW":
      return "Mới / ít mua";
    default:
      return "Ổn định";
  }
}

/** Sort priority for table: VIP first, then churn risk, then others by monetary. */
export function rfmSegmentSortRank(segment: RfmSegment): number {
  switch (segment) {
    case "VIP":
      return 0;
    case "CHURN_RISK":
      return 1;
    case "POTENTIAL":
      return 2;
    case "NEW_LOW":
      return 3;
    default:
      return 4;
  }
}

/**
 * Assign quintile scores 1–5. Higher is better.
 * For recency, pass inverted values (lower days = better) OR set invert=true.
 */
export function scoreQuintiles(
  values: number[],
  opts?: { invert?: boolean },
): number[] {
  const n = values.length;
  if (n === 0) return [];
  if (n === 1) return [5];

  const invert = opts?.invert ?? false;
  const indexed = values.map((value, index) => ({ value, index }));
  indexed.sort((a, b) => {
    const cmp = invert ? a.value - b.value : b.value - a.value;
    if (cmp !== 0) return cmp;
    return a.index - b.index;
  });

  const scores = new Array<number>(n);
  for (let rank = 0; rank < n; rank++) {
    // rank 0 = best → score 5
    const score = Math.min(5, Math.max(1, 5 - Math.floor((rank * 5) / n)));
    scores[indexed[rank].index] = score;
  }

  // Stabilize ties: same raw value → same score (take max among tied group after invert sort)
  // Re-pass: group by value
  const byValue = new Map<number, number[]>();
  for (let i = 0; i < n; i++) {
    const list = byValue.get(values[i]) ?? [];
    list.push(i);
    byValue.set(values[i], list);
  }
  for (const indices of byValue.values()) {
    if (indices.length < 2) continue;
    const best = Math.max(...indices.map((i) => scores[i]));
    for (const i of indices) scores[i] = best;
  }

  return scores;
}

export function assignRfmSegment(scores: RfmScores): RfmSegment {
  const { r, f, m } = scores;
  if (r >= 4 && f >= 4 && m >= 4) return "VIP";
  if (r <= 2 && (f >= 3 || m >= 3)) return "CHURN_RISK";
  if (r >= 4 && f <= 2 && m >= 3) return "POTENTIAL";
  if (f <= 2 && m <= 2) return "NEW_LOW";
  return "STABLE";
}
