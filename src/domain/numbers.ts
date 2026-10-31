/** Number parsing and formatting helpers (Persian digits, thousands separators, Toman). */

export const MAX_RATE = 1_000_000_000; // Toman per device
export const MAX_QTY = 1_000_000; // devices
export const MAX_BUDGET = 1_000_000_000_000_000; // 10^15 Toman — keeps all products inside Number.MAX_SAFE_INTEGER

const FA = '۰۱۲۳۴۵۶۷۸۹';
const AR = '٠١٢٣٤٥٦٧٨٩';

export function toLatinDigits(input: string): string {
  return input
    .replace(/[۰-۹]/g, (d) => String(FA.indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String(AR.indexOf(d)));
}

export function toPersianDigits(input: string | number): string {
  return String(input).replace(/[0-9]/g, (d) => FA[Number(d)]);
}

export type ParsedNumber =
  | { ok: true; value: number | null } // null = empty field
  | { ok: false; message: string };

/**
 * Parses a user-typed non-negative integer. Accepts Persian/Arabic digits and
 * thousands separators (٬ , ، space). Rejects negatives, decimals and letters.
 */
export function parseIntegerInput(raw: string, max = Number.MAX_SAFE_INTEGER): ParsedNumber {
  const cleaned = toLatinDigits(String(raw ?? ''))
    .replace(/[٬,،\s‌‏‎]/g, '')
    .trim();
  if (cleaned === '') return { ok: true, value: null };
  if (cleaned.startsWith('-') || cleaned.startsWith('−')) return { ok: false, message: 'عدد منفی مجاز نیست.' };
  if (!/^\d+$/.test(cleaned)) return { ok: false, message: 'فقط رقم وارد کنید.' };
  const value = Number(cleaned);
  if (!Number.isSafeInteger(value) || value > max) return { ok: false, message: 'عدد واردشده بیش از حد بزرگ است.' };
  return { ok: true, value };
}

export function formatInt(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return '—';
  const n = Math.round(value);
  const sign = n < 0 ? '-' : '';
  return sign + toPersianDigits(String(Math.abs(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '٬'));
}

export function formatToman(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return '—';
  return `${formatInt(value)} تومان`;
}

/** Plain digits for CSV / machine use. */
export function rawInt(value: number | null | undefined): string {
  return value === null || value === undefined ? '' : String(Math.round(value));
}

export function normalizeSerial(input: string): string {
  return toLatinDigits(String(input ?? ''))
    .replace(/[\s‌‏‎-]+/g, '')
    .toUpperCase();
}

/* ---------------- dates ---------------- */

const jalaliFmt = new Intl.DateTimeFormat('fa-IR-u-ca-persian-nu-arabext', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  timeZone: 'UTC',
});
const jalaliLongFmt = new Intl.DateTimeFormat('fa-IR-u-ca-persian-nu-arabext', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  timeZone: 'UTC',
});

export function isIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const d = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}

/** Jalali date like ۱۴۰۵/۰۸/۱۰. */
export function formatDate(iso: string | null | undefined): string {
  if (!iso || !isIsoDate(iso)) return '—';
  return jalaliFmt.format(new Date(`${iso}T00:00:00Z`)).replace(/[‏‎]/g, '');
}

export function formatDateLong(iso: string | null | undefined): string {
  if (!iso || !isIsoDate(iso)) return '—';
  return jalaliLongFmt.format(new Date(`${iso}T00:00:00Z`));
}

export function todayIso(now: number = Date.now()): string {
  return new Date(now).toISOString().slice(0, 10);
}

export function addDaysIso(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function daysBetween(fromIso: string, toIso: string): number {
  const a = new Date(`${fromIso}T00:00:00Z`).getTime();
  const b = new Date(`${toIso}T00:00:00Z`).getTime();
  return Math.round((b - a) / 86_400_000);
}
