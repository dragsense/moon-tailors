import type { IVendorTotals } from "@moon-tailors/contracts";

/** Derived from totals — never stored. */
export type TVendorPaymentStatus = "paid" | "partial" | "unpaid" | "none";

export function vendorPaymentStatus(totals: IVendorTotals): TVendorPaymentStatus {
  if (totals.total <= 0) return "none";
  if (totals.remaining <= 0) return "paid";
  if (totals.paid > 0) return "partial";
  return "unpaid";
}

export function vendorPaymentBadgeClass(status: TVendorPaymentStatus): string {
  switch (status) {
    case "paid":
      return "border-transparent bg-emerald-700 text-white";
    case "partial":
      return "border-transparent bg-amber-600 text-white";
    case "unpaid":
      return "border-transparent bg-red-700 text-white";
    default:
      return "border-transparent bg-slate-500 text-white";
  }
}

/** Tile wash for Total / Paid / Remaining. */
export function vendorTotalsTileClass(
  key: "total" | "paid" | "remaining",
  totals: IVendorTotals,
): string {
  if (key === "paid" && totals.paid > 0) {
    return "border-emerald-300/80 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950";
  }
  if (key === "remaining" && totals.remaining > 0) {
    return "border-red-300/80 bg-red-50 dark:border-red-800 dark:bg-red-950";
  }
  if (key === "remaining" && totals.total > 0) {
    return "border-emerald-300/80 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950";
  }
  return "border-border/50";
}

export function vendorTotalsValueClass(
  key: "total" | "paid" | "remaining",
  totals: IVendorTotals,
): string {
  if (key === "paid" && totals.paid > 0) {
    return "text-emerald-700 dark:text-emerald-400";
  }
  if (key === "remaining" && totals.remaining > 0) {
    return "text-red-700 dark:text-red-400";
  }
  if (key === "remaining" && totals.total > 0) {
    return "text-emerald-700 dark:text-emerald-400";
  }
  return "";
}
