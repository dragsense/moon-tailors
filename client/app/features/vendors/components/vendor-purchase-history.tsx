import { useState } from "react";
import type { IVendorPurchase } from "@moon-tailors/contracts";
import { formatDateWithSettings, useSettings } from "~/features/settings";
import { useI18n } from "~/hooks/use-i18n";
import { formatAmount } from "../lib/format";
import {
  DateRangeFilter,
  EMPTY_DATE_RANGE,
  inDateRange,
  isDateRangeActive,
} from "./date-range-filter";

type VendorPurchaseHistoryProps = {
  purchases: IVendorPurchase[];
};

/** Every purchase with its line items, newest first, filterable by date. */
export function VendorPurchaseHistory({ purchases }: VendorPurchaseHistoryProps) {
  const { t, intlLocale } = useI18n();
  const prefs = useSettings();
  const [range, setRange] = useState(EMPTY_DATE_RANGE);

  const shown = purchases.filter((purchase) =>
    inDateRange(purchase.purchaseDate, range),
  );
  const shownTotal = shown.reduce((sum, purchase) => sum + purchase.total, 0);

  return (
    <section className="min-w-0 rounded-xl border border-border/60 bg-card p-4">
      <div className="mb-3 flex flex-col gap-2">
        <h2 className="font-heading text-base font-semibold">
          {t("vendors.purchaseHistory")}
        </h2>
        {purchases.length > 0 ? (
          <DateRangeFilter id="purchases" value={range} onChange={setRange} />
        ) : null}
        {isDateRangeActive(range) ? (
          <p className="text-muted-foreground text-xs tabular-nums">
            {t("vendors.filteredSummary", {
              count: shown.length,
              amount: formatAmount(shownTotal, intlLocale),
            })}
          </p>
        ) : null}
      </div>

      {purchases.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          {t("vendors.purchasesEmpty")}
        </p>
      ) : shown.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          {t("vendors.noneInRange")}
        </p>
      ) : (
        <ol className="flex flex-col gap-3">
          {shown.map((purchase) => (
            <li
              key={purchase.id}
              className="rounded-lg border border-border/50 px-3 py-2 text-sm"
            >
              <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
                <p className="font-medium tabular-nums">
                  {formatDateWithSettings(purchase.purchaseDate, prefs, intlLocale)}
                </p>
                <p className="font-semibold tabular-nums">
                  {formatAmount(purchase.total, intlLocale)}
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="text-muted-foreground">
                    <tr>
                      <th className="py-1 text-start font-medium">
                        {t("vendors.item")}
                      </th>
                      <th className="py-1 text-end font-medium">
                        {t("vendors.quantity")}
                      </th>
                      <th className="py-1 text-end font-medium">
                        {t("vendors.unitPrice")}
                      </th>
                      <th className="py-1 text-end font-medium">
                        {t("vendors.lineTotal")}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="tabular-nums">
                    {purchase.items.map((item) => (
                      <tr key={item.id} className="border-t border-border/40">
                        <td className="py-1 pe-2">{item.description}</td>
                        <td className="py-1 text-end">
                          {formatAmount(item.quantity, intlLocale, null)}
                        </td>
                        <td className="py-1 text-end">
                          {formatAmount(item.unitPrice, intlLocale)}
                        </td>
                        <td className="py-1 text-end">
                          {formatAmount(item.total, intlLocale)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {purchase.notes ? (
                <p className="text-muted-foreground mt-2 text-xs">
                  {purchase.notes}
                </p>
              ) : null}
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
