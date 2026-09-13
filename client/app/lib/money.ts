/** Shop currency label shown with money amounts. */
export const DEFAULT_CURRENCY = "PKR";

/**
 * Amount display with locale grouping, up to 2 decimals.
 * Adds the currency by default ("PKR 25,000"); pass `null` for plain numbers (quantities).
 */
export function formatAmount(
  value: number,
  intlLocale?: string,
  currency: string | null = DEFAULT_CURRENCY,
) {
  const amount = value.toLocaleString(intlLocale, { maximumFractionDigits: 2 });
  return currency ? `${currency} ${amount}` : amount;
}

/** Amounts at or above this are shortened by `formatCompactAmount`. */
export const COMPACT_AMOUNT_THRESHOLD = 100_000;

const COMPACT_UNITS = [
  { value: 1_000_000_000, suffix: "B" },
  { value: 1_000_000, suffix: "M" },
  { value: 1_000, suffix: "K" },
] as const;

/**
 * Short amount for tight spaces — "PKR 199K", "PKR 1.13M".
 * Below the threshold it is the same as `formatAmount`.
 * `isCompact` tells callers when to offer the full amount (e.g. on hover).
 */
export function formatCompactAmount(
  value: number,
  intlLocale?: string,
  currency: string | null = DEFAULT_CURRENCY,
  threshold = COMPACT_AMOUNT_THRESHOLD,
): { text: string; full: string; isCompact: boolean } {
  const full = formatAmount(value, intlLocale, currency);
  if (Math.abs(value) < threshold) {
    return { text: full, full, isCompact: false };
  }

  const unit = COMPACT_UNITS.find((entry) => Math.abs(value) >= entry.value)!;
  const scaled = value / unit.value;
  const short = scaled.toLocaleString(intlLocale, {
    maximumFractionDigits: Math.abs(scaled) >= 100 ? 0 : 2,
  });
  const text = currency
    ? `${currency} ${short}${unit.suffix}`
    : `${short}${unit.suffix}`;
  return { text, full, isCompact: true };
}
