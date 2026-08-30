export function todayISO(): string {
  return toISODate(new Date());
}

export function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, '0');
  const day = `${d.getDate()}`.padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function parseISODate(iso: string): Date | null {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null;
  const [y, m, d] = iso.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatJP(iso: string): string {
  const d = parseISODate(iso);
  if (!d) return iso;
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
}

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function daysBetween(from: Date, to: Date): number {
  const ms = startOfDay(to).getTime() - startOfDay(from).getTime();
  return Math.round(ms / (1000 * 60 * 60 * 24));
}

/** Returns days remaining until the next occurrence of an anniversary (yearly repeat aware). */
export function daysUntilNext(iso: string, repeatYearly: boolean): number | null {
  const base = parseISODate(iso);
  if (!base) return null;
  const now = startOfDay(new Date());

  if (!repeatYearly) {
    return daysBetween(now, base);
  }

  let next = new Date(now.getFullYear(), base.getMonth(), base.getDate());
  if (daysBetween(now, next) < 0) {
    next = new Date(now.getFullYear() + 1, base.getMonth(), base.getDate());
  }
  return daysBetween(now, next);
}

export function yearsSince(iso: string): number | null {
  const base = parseISODate(iso);
  if (!base) return null;
  const now = new Date();
  let years = now.getFullYear() - base.getFullYear();
  const hadAnniversaryThisYear =
    now.getMonth() > base.getMonth() ||
    (now.getMonth() === base.getMonth() && now.getDate() >= base.getDate());
  if (!hadAnniversaryThisYear) years -= 1;
  return years;
}

export function addDays(iso: string, days: number): string | null {
  const d = parseISODate(iso);
  if (!d) return null;
  const next = new Date(d);
  next.setDate(next.getDate() + days);
  return toISODate(next);
}

export function averageCycleLength(sortedStartDatesAsc: string[]): number | null {
  if (sortedStartDatesAsc.length < 2) return null;
  const diffs: number[] = [];
  for (let i = 1; i < sortedStartDatesAsc.length; i++) {
    const prev = parseISODate(sortedStartDatesAsc[i - 1]);
    const cur = parseISODate(sortedStartDatesAsc[i]);
    if (prev && cur) diffs.push(daysBetween(prev, cur));
  }
  if (diffs.length === 0) return null;
  const sum = diffs.reduce((a, b) => a + b, 0);
  return Math.round(sum / diffs.length);
}
