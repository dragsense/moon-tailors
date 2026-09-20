import { useState } from "react";
import { PencilIcon } from "lucide-react";
import type { IStaffPayment } from "@moon-tailors/contracts";
import { Button } from "~/components/ui/button";
import {
  DateRangeFilter,
  EMPTY_DATE_RANGE,
  inDateRange,
  isDateRangeActive,
} from "~/features/vendors/components/date-range-filter";
import { formatDateWithSettings, useSettings } from "~/features/settings";
import { useI18n } from "~/hooks/use-i18n";
import { formatAmount } from "~/lib/money";
import { cn } from "~/lib/utils";

type StaffPaymentHistoryProps = {
  payments: IStaffPayment[];
  /** Omitted when the user may not change payments — the row then has no button. */
  onEdit?: (payment: IStaffPayment) => void;
  className?: string;
};

/** Every payment made to the staff member, newest first, filterable by date. */
export function StaffPaymentHistory({
  payments,
  onEdit,
  className,
}: StaffPaymentHistoryProps) {
  const { t, intlLocale } = useI18n();
  const prefs = useSettings();
  const [range, setRange] = useState(EMPTY_DATE_RANGE);

  const shown = payments.filter((payment) =>
    inDateRange(payment.paymentDate, range),
  );
  const shownTotal = shown.reduce((sum, payment) => sum + payment.amount, 0);
  // Only on-demand payments carry a total, so the column appears only for them.
  const hasTotals = payments.some((payment) => payment.totalAmount !== null);

  return (
    <section
      className={cn(
        "min-w-0 rounded-xl border border-border/60 bg-card p-4",
        className,
      )}
    >
      <div className="mb-3 flex flex-col gap-2">
        <h2 className="font-heading text-base font-semibold">
          {t("staff.paymentHistory")}
        </h2>
        {payments.length > 0 ? (
          <DateRangeFilter
            id="staff-payments"
            value={range}
            onChange={setRange}
          />
        ) : null}
        {isDateRangeActive(range) ? (
          <p className="text-muted-foreground text-xs tabular-nums">
            {t("staff.filteredSummary", {
              count: shown.length,
              amount: formatAmount(shownTotal, intlLocale),
            })}
          </p>
        ) : null}
      </div>

      {payments.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          {t("staff.paymentsEmpty")}
        </p>
      ) : shown.length === 0 ? (
        <p className="text-muted-foreground text-sm">{t("staff.noneInRange")}</p>
      ) : (
        <div className="min-w-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-muted-foreground border-b border-border/60 text-left text-xs">
                <th className="py-1.5 pr-3 font-medium">
                  {t("staff.paymentDate")}
                </th>
                {hasTotals ? (
                  <th className="py-1.5 pr-3 text-right font-medium">
                    {t("staff.totalAmount")}
                  </th>
                ) : null}
                <th className="py-1.5 pr-3 text-right font-medium">
                  {t("staff.paidAmount")}
                </th>
                {onEdit ? <th className="w-px py-1.5" /> : null}
              </tr>
            </thead>
            <tbody>
              {shown.map((payment) => (
                <tr key={payment.id} className="border-b border-border/40">
                  <td className="py-2 pr-3 align-top">
                    <span className="font-medium tabular-nums">
                      {formatDateWithSettings(
                        payment.paymentDate,
                        prefs,
                        intlLocale,
                      )}
                    </span>
                    {payment.notes ? (
                      <span className="text-muted-foreground block text-xs">
                        {payment.notes}
                      </span>
                    ) : null}
                  </td>
                  {hasTotals ? (
                    <td className="py-2 pr-3 text-right align-top tabular-nums">
                      {payment.totalAmount === null
                        ? "—"
                        : formatAmount(payment.totalAmount, intlLocale)}
                    </td>
                  ) : null}
                  <td className="py-2 pr-3 text-right align-top font-semibold tabular-nums text-emerald-700 dark:text-emerald-400">
                    {formatAmount(payment.amount, intlLocale)}
                  </td>
                  {onEdit ? (
                    <td className="py-2 align-top">
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="size-7"
                        aria-label={t("staff.editPayment")}
                        onClick={() => onEdit(payment)}
                      >
                        <PencilIcon className="size-3.5" />
                      </Button>
                    </td>
                  ) : null}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
