// Session-scoped display preferences for money values.
// Lives in sessionStorage: resets on reload / new tab, per the product decision.
import { useSyncExternalStore } from "react";

export type MoneyUnit = "auto" | "full" | "k" | "m";
export type MoneyDecimals = "auto" | 0 | 1 | 2;

export type NumberFormatPrefs = {
  unit: MoneyUnit;
  decimals: MoneyDecimals;
};

export const DEFAULT_NUMBER_FORMAT: NumberFormatPrefs = { unit: "auto", decimals: "auto" };

const KEY = "number-format-prefs";

let current: NumberFormatPrefs = DEFAULT_NUMBER_FORMAT;
let hydrated = false;
const listeners = new Set<() => void>();

function hydrate() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  try {
    const raw = window.sessionStorage.getItem(KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw) as Partial<NumberFormatPrefs>;
    const unit: MoneyUnit =
      parsed.unit === "full" || parsed.unit === "k" || parsed.unit === "m" ? parsed.unit : "auto";
    const decimals: MoneyDecimals =
      parsed.decimals === 0 || parsed.decimals === 1 || parsed.decimals === 2 ? parsed.decimals : "auto";
    current = { unit, decimals };
  } catch {
    /* ignore */
  }
}

export function getNumberFormat(): NumberFormatPrefs {
  hydrate();
  return current;
}

export function setNumberFormat(next: Partial<NumberFormatPrefs>) {
  hydrate();
  current = { ...current, ...next };
  if (typeof window !== "undefined") {
    try {
      window.sessionStorage.setItem(KEY, JSON.stringify(current));
    } catch {
      /* ignore */
    }
  }
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

/** Subscribe a component to the current money-format setting. */
export function useNumberFormat(): NumberFormatPrefs {
  return useSyncExternalStore(subscribe, getNumberFormat, () => DEFAULT_NUMBER_FORMAT);
}

function group(n: number, decimals: number): string {
  return n.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

/**
 * Format a money amount using the active (or supplied) display preferences.
 * `auto` reproduces the previous behaviour: >=1M as $x.xM, >=1K as $xK, else $x.
 */
export function formatMoney(value: number | string | null | undefined, prefs?: NumberFormatPrefs): string {
  const raw = typeof value === "string" ? Number(value) : value;
  const n = Number.isFinite(raw as number) ? (raw as number) : 0;
  const p = prefs ?? getNumberFormat();
  const abs = Math.abs(n);

  let unit: Exclude<MoneyUnit, "auto"> = p.unit === "auto" ? (abs >= 1_000_000 ? "m" : abs >= 1_000 ? "k" : "full") : p.unit;

  const autoDecimals = unit === "m" ? 1 : 0;
  const decimals = p.decimals === "auto" ? autoDecimals : p.decimals;

  if (unit === "m") return `$${group(n / 1_000_000, decimals)}M`;
  if (unit === "k") return `$${group(n / 1_000, decimals)}K`;
  return `$${group(n, decimals)}`;
}

/** Signed variant, e.g. +$1.2M / −$0.4M. */
export function formatMoneyDelta(value: number, prefs?: NumberFormatPrefs): string {
  const s = formatMoney(Math.abs(value), prefs);
  return `${value < 0 ? "−" : "+"}${s}`;
}

/** Short label for the current unit, for axis captions. */
export function unitSuffix(prefs?: NumberFormatPrefs): string {
  const p = prefs ?? getNumberFormat();
  return p.unit === "m" ? "M" : p.unit === "k" ? "K" : "";
}
