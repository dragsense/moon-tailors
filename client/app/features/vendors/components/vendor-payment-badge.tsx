import type { IVendorTotals } from "@moon-tailors/contracts";
import { useI18n } from "~/hooks/use-i18n";
import { cn } from "~/lib/utils";
import {
  vendorPaymentBadgeClass,
  vendorPaymentStatus,
} from "../status-style";

type VendorPaymentBadgeProps = {
  totals: IVendorTotals;
  className?: string;
};

/** Paid (green) · Partly paid (amber) · Unpaid (red) · No purchases (grey). */
export function VendorPaymentBadge({ totals, className }: VendorPaymentBadgeProps) {
  const { t } = useI18n();
  const status = vendorPaymentStatus(totals);
  const label = {
    paid: t("vendors.statusPaid"),
    partial: t("vendors.statusPartial"),
    unpaid: t("vendors.statusUnpaid"),
    none: t("vendors.statusNone"),
  }[status];

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 text-xs font-medium",
        vendorPaymentBadgeClass(status),
        className,
      )}
    >
      {label}
    </span>
  );
}
