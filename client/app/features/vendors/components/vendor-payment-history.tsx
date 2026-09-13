import { useState } from "react";
import type { IVendorPayment } from "@moon-tailors/contracts";
import { formatDateWithSettings, useSettings } from "~/features/settings";
import { useI18n } from "~/hooks/use-i18n";
import { formatAmount } from "../lib/format";
import {
  DateRangeFilter,
  EMPTY_DATE_RANGE,
  inDateRange,
  isDateRangeActive,
} from "./date-range-filter";

type VendorPaymentHistoryProps = {
  payments: IVendorPayment[];
};

/** Every payment to the vendor, newest first, filterable by date. */
export function VendorPaymentHistory({ payments }: VendorPaymentHistoryProps) {
  const { t, intlLocale } = useI18n();
  const prefs = useSettings();
  const [range, setRange] = useState(EMPTY_DATE_RANGE);

  const shown = payments.filter((payment) =>
    inDateRange(payment.paymentDate, range),
  );
  const shownTotal = shown.reduce((sum, payment) => sum + payment.amount, 0);

  return (
    <section className="min-w-0 rounded-xl border border-border/60 bg-card p-4">
      <div className="mb-3 flex flex-col gap-2">
        <h2 className="font-heading text-base font-semibold">
          {t("vendors.paymentHistory")}
        </h2>
        {payments.length > 0 ? (
          <DateRangeFilter id="payments" value={range} onChange={setRange} />
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

      {payments.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          {t("vendors.paymentsEmpty")}
        </p>
      ) : shown.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          {t("vendors.noneInRange")}
        </p>
      ) : (
        <ol className="flex flex-col gap-2">
          {shown.map((payment) => (
            <li
              key={payment.id}
              className="rounded-lg border border-border/50 px-3 py-2 text-sm"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="font-medium tabular-nums">
                  {formatDateWithSettings(payment.paymentDate, prefs, intlLocale)}
                </p>
                <p className="font-semibold tabular-nums text-emerald-700 dark:text-emerald-400">
                  {formatAmount(payment.amount, intlLocale)}
                </p>
              </div>
              {payment.notes ? (
                <p className="text-muted-foreground mt-1 text-xs">
                  {payment.notes}
                </p>
              ) : null}
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
