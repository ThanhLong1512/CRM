/** Format a Date as YYYY-MM-DD in local timezone. */
export function formatVisitDateLocal(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Parse YYYY-MM-DD into a Date at local midnight. */
export function parseVisitDateLocal(isoDate: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate.trim());
  if (!match) return null;
  const y = Number(match[1]);
  const m = Number(match[2]);
  const d = Number(match[3]);
  const date = new Date(y, m - 1, d);
  if (
    date.getFullYear() !== y ||
    date.getMonth() !== m - 1 ||
    date.getDate() !== d
  ) {
    return null;
  }
  return date;
}

export function todayVisitDateLocal(): string {
  return formatVisitDateLocal(new Date());
}

/** Start of week (Monday) for a given date. */
export function startOfWeekMonday(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d;
}

/** Seven dates Mon–Sun for the week containing `weekStart`. */
export function weekDatesFromStart(weekStart: Date): string[] {
  const dates: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    dates.push(formatVisitDateLocal(d));
  }
  return dates;
}

export function formatVisitDateLabel(isoDate: string): string {
  const parsed = parseVisitDateLocal(isoDate);
  if (!parsed) return isoDate;
  return parsed.toLocaleDateString("vi-VN", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
  });
}

export const VISIT_PLAN_PAST_DAYS = 7;
export const VISIT_PLAN_FUTURE_DAYS = 90;

export function visitPlanWindow(): { from: Date; to: Date } {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const from = new Date(now);
  from.setDate(from.getDate() - VISIT_PLAN_PAST_DAYS);
  const to = new Date(now);
  to.setDate(to.getDate() + VISIT_PLAN_FUTURE_DAYS);
  return { from, to };
}
