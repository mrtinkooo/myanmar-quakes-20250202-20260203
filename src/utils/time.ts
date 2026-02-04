export const DAY_MS = 24 * 60 * 60 * 1000;

export function utcDayStartMs(epochMs: number): number {
  const d = new Date(epochMs);
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

export function parseDateInputToUtcDayStartMs(dateStr: string): number {
  // Expected format from <input type="date">: YYYY-MM-DD
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr);
  if (!m) throw new Error(`Invalid date input: ${dateStr}`);
  const year = Number(m[1]);
  const month = Number(m[2]);
  const day = Number(m[3]);
  return Date.UTC(year, month - 1, day);
}

export function msToUtcDateInput(epochMs: number): string {
  return new Date(epochMs).toISOString().slice(0, 10);
}

export function formatUtcDate(epochMs: number): string {
  return new Date(epochMs).toISOString().slice(0, 10);
}

export function formatUtcDateTime(epochMs: number): string {
  // `toISOString()` => 2026-02-03T15:51:30.749Z
  const iso = new Date(epochMs).toISOString();
  return iso.replace('T', ' ').replace(/\.\d{3}Z$/, 'Z');
}

