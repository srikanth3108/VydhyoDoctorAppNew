import type {EarningsData} from '../services/api';
import type {SettlementDateRange} from '../components/provider/SettlementDateFilter';

type SettlementRow = EarningsData['settlementHistory'][number];

/** Reference "today" for mock data — May 2026 */
const REF_NOW = new Date('2026-05-25T12:00:00').getTime();

function startOfWeek(ms: number): number {
  const d = new Date(ms);
  const day = d.getDay();
  const diff = day === 0 ? 6 : day - 1;
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - diff);
  return d.getTime();
}

function startOfMonth(ms: number): number {
  const d = new Date(ms);
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function startOfDay(ms: number): number {
  const d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function isSameDay(a: number, b: number): boolean {
  return startOfDay(a) === startOfDay(b);
}

export function settlementInRange(
  row: SettlementRow,
  range: SettlementDateRange,
  nowMs: number = REF_NOW,
  customDayMs?: number | null,
  customRangeStartMs?: number | null,
  customRangeEndMs?: number | null,
): boolean {
  if (range === 'all') return true;

  if (range === 'custom' && customDayMs != null) {
    if (row.status === 'Pending') return false;
    if (row.dateMs == null) return false;
    return isSameDay(row.dateMs, customDayMs);
  }

  if (range === 'range' && customRangeStartMs != null && customRangeEndMs != null) {
    if (row.status === 'Pending') return false;
    if (row.dateMs == null) return false;
    const dateStart = startOfDay(customRangeStartMs);
    const dateEnd = startOfDay(customRangeEndMs) + 24 * 60 * 60 * 1000 - 1;
    return row.dateMs >= dateStart && row.dateMs <= dateEnd;
  }

  if (row.status === 'Pending') return true;

  const ts = row.dateMs;
  if (ts == null) return false;

  if (range === 'week') {
    return ts >= startOfWeek(nowMs);
  }
  if (range === 'month') {
    return ts >= startOfMonth(nowMs);
  }
  if (range === 'last30') {
    return ts >= nowMs - 30 * 24 * 60 * 60 * 1000;
  }

  return true;
}

export function filterSettlements(
  history: SettlementRow[],
  range: SettlementDateRange,
  customDayMs?: number | null,
  customRangeStartMs?: number | null,
  customRangeEndMs?: number | null,
): SettlementRow[] {
  return history.filter(row =>
    settlementInRange(row, range, REF_NOW, customDayMs, customRangeStartMs, customRangeEndMs),
  );
}

export function formatSettlementDay(ms: number): string {
  return new Date(ms).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}
