/** Small shared helpers. */

/** Stable, dependency-free class joiner. */
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function todayISO(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function addDaysISO(iso: string, days: number): string {
  const [y, m, d] = iso.split('-').map(Number);
  const date = new Date(y, (m ?? 1) - 1, d ?? 1);
  date.setDate(date.getDate() + days);
  return todayISO(date);
}

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/** "Tuesday, 14 October" — used for greeting + duty copy. */
export function formatLongDate(d: Date = new Date()): string {
  const month = d.toLocaleDateString('en-GB', { month: 'long' });
  return `${WEEKDAYS[d.getDay()]}, ${d.getDate()} ${month}`;
}

export function formatShortDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
  });
}

/** Greeting tied to the local clock. */
export function greeting(d: Date = new Date()): string {
  const h = d.getHours();
  if (h < 5) return 'Still up';
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

export function formatTimeAgo(isoTimestamp: string): string {
  const then = new Date(isoTimestamp).getTime();
  if (Number.isNaN(then)) return 'just now';
  const secs = Math.max(1, Math.floor((Date.now() - then) / 1000));
  if (secs < 60) return 'just now';
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} h ago`;
  const days = Math.floor(hrs / 24);
  return `${days} d ago`;
}

export function formatClock(isoTimestamp: string): string {
  const d = new Date(isoTimestamp);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

export function firstName(full: string): string {
  return full.trim().split(/\s+/)[0] ?? full;
}

export function initialsOf(full: string): string {
  const parts = full.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '··';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

let counter = 0;
export function uid(prefix = 'id'): string {
  counter += 1;
  return `${prefix}_${Date.now().toString(36)}_${counter.toString(36)}`;
}

/* --------------------------------- months -------------------------------- */

/** "2026-10" for the current local month — payments are billed by month. */
export function monthKey(d: Date = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

/** Shifts a `YYYY-MM` key by whole months, keeping the month valid. */
export function addMonths(key: string, delta: number): string {
  const [y, m] = key.split('-').map(Number);
  const date = new Date(y ?? 1970, ((m ?? 1) - 1) + delta, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

/**
 * Whole months from `from` to `to`, both `YYYY-MM`. Negative when `to` is
 * before `from`, so callers can compare without reordering the arguments.
 */
export function monthsBetween(from: string, to: string): number {
  const [fy, fm] = from.split('-').map(Number);
  const [ty, tm] = to.split('-').map(Number);
  return (ty ?? 0) * 12 + (tm ?? 0) - ((fy ?? 0) * 12 + (fm ?? 0));
}

/** "October 2026" — the label used in the payment ledger. */
export function formatMonth(key: string): string {
  const [y, m] = key.split('-').map(Number);
  return new Date(y ?? 1970, (m ?? 1) - 1, 1).toLocaleDateString('en-GB', {
    month: 'long',
    year: 'numeric',
  });
}

/** "1 250 000 so'm" — grouped the way an Uzbek ledger writes it. */
export function formatSum(value: number): string {
  return `${new Intl.NumberFormat('en-US').format(Math.round(value))} so‘m`;
}
