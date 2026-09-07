export type HungerAlertLevel = "RED" | "YELLOW";

export type HungerInput = {
  lastOrderAt: Date;
  avgCycleDays: number;
  now?: Date;
};

export type HungerStatus = {
  daysSinceLast: number;
  avgCycleDays: number;
  remaining: number;
  percent: number;
  level: HungerAlertLevel | "GREEN";
  overdue: boolean;
  expectedNextAt: Date;
};

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export const DEFAULT_HUNGER_CYCLE_DAYS = 30;
export const MAX_ORDERS_FOR_CYCLE = 12;

/** Mean gap (days) between consecutive order dates; cold-start → default 30. */
export function computeAvgCycleDays(orderDatesAsc: Date[]): number {
  if (orderDatesAsc.length < 2) return DEFAULT_HUNGER_CYCLE_DAYS;

  const recent = orderDatesAsc.slice(-MAX_ORDERS_FOR_CYCLE);
  let sum = 0;
  for (let i = 1; i < recent.length; i++) {
    sum +=
      (recent[i].getTime() - recent[i - 1].getTime()) / MS_PER_DAY;
  }
  const avg = sum / (recent.length - 1);
  return Math.max(1, Math.round(avg));
}

export function computeHungerStatus(input: HungerInput): HungerStatus {
  const now = input.now ?? new Date();
  const cycle = Math.max(1, input.avgCycleDays);
  const daysSinceLast = Math.max(
    0,
    (now.getTime() - input.lastOrderAt.getTime()) / MS_PER_DAY,
  );
  const remainingRaw = cycle - daysSinceLast;
  const remaining = remainingRaw;
  const percent = Math.max(0, Math.min(100, (remainingRaw / cycle) * 100));
  const overdue = remainingRaw <= 0;
  const expectedNextAt = new Date(
    input.lastOrderAt.getTime() + cycle * MS_PER_DAY,
  );

  let level: HungerStatus["level"] = "GREEN";
  if (percent <= 10 || overdue) {
    level = "RED";
  } else if (percent <= 25) {
    level = "YELLOW";
  }

  return {
    daysSinceLast: Math.floor(daysSinceLast),
    avgCycleDays: cycle,
    remaining,
    percent,
    level,
    overdue,
    expectedNextAt,
  };
}

export function hungerLevelLabel(level: HungerAlertLevel): string {
  return level === "RED" ? "Đỏ — đến hạn ghé" : "Vàng — sắp đến hạn";
}
