import type { TBillingLineItem } from "./types.js";

/** Line-item subtotal in cents (before tax). */
export function computeBillingSubtotalCents(
  lineItems: ReadonlyArray<Pick<TBillingLineItem, "quantity" | "unitPrice">>,
): number {
  return lineItems.reduce(
    (sum, item) =>
      sum +
      Math.round((Number(item.quantity) || 0) * (Number(item.unitPrice) || 0) * 100),
    0,
  );
}

/**
 * Invoice total in cents: subtotal × (1 + taxRate%).
 * Shared by server persist + client live preview.
 */
export function computeBillingAmountCents(
  lineItems: ReadonlyArray<Pick<TBillingLineItem, "quantity" | "unitPrice">>,
  taxRate = 0,
): number {
  const subtotal = computeBillingSubtotalCents(lineItems);
  return Math.round(subtotal * (1 + (Number(taxRate) || 0) / 100));
}

/** Format cents as `$12.34` (en-US). */
export function formatBillingCents(cents: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format((Number(cents) || 0) / 100);
}
