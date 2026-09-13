import type { IVendorTotals } from "@moon-tailors/contracts";
import { CompactAmount } from "~/components/compact-amount";
import { useI18n } from "~/hooks/use-i18n";
import { cn } from "~/lib/utils";
import { vendorTotalsTileClass, vendorTotalsValueClass } from "../status-style";

type VendorTotalsProps = {
  totals: IVendorTotals;
  size?: "sm" | "lg";
  className?: string;
};

/**
 * Total (purchases) · Paid (green) · Remaining (red while owed, green when cleared).
 * Phones: one row each (label left, amount right). Wider: three tiles.
 * Big amounts are shortened ("PKR 1.13M") with the exact value in a tooltip.
 */
export function VendorTotals({ totals, size = "lg", className }: VendorTotalsProps) {
  const { t } = useI18n();
  const tiles = [
    { key: "total", label: t("vendors.total"), value: totals.total },
    { key: "paid", label: t("vendors.paid"), value: totals.paid },
    { key: "remaining", label: t("vendors.remaining"), value: totals.remaining },
  ] as const;

  return (
    <div className={cn("grid grid-cols-1 gap-1.5 sm:grid-cols-3 sm:gap-2", className)}>
      {tiles.map((tile) => (
        <div
          key={tile.key}
          className={cn(
            "flex min-w-0 items-baseline justify-between gap-2 rounded-lg border px-3 py-1.5",
            "sm:block sm:py-2",
            vendorTotalsTileClass(tile.key, totals),
          )}
        >
          <p className="text-muted-foreground shrink-0 text-xs">{tile.label}</p>
          <p
            className={cn(
              "min-w-0 text-sm font-semibold",
              size === "lg" ? "sm:text-base lg:text-lg" : "sm:text-sm",
              vendorTotalsValueClass(tile.key, totals),
            )}
          >
            <CompactAmount value={tile.value} label={tile.label} />
          </p>
        </div>
      ))}
    </div>
  );
}
