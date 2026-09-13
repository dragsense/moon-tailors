import type { IStaffEmployment } from "@moon-tailors/contracts";
import { formatDateWithSettings, useSettings } from "~/features/settings";
import { useI18n } from "~/hooks/use-i18n";
import { formatAmount } from "~/lib/money";
import { cn } from "~/lib/utils";
import { staffPayTypeLabel } from "../lib/labels";

type StaffEmploymentHistoryProps = {
  employments: IStaffEmployment[];
  className?: string;
};

/** Every join → leave period, newest first. */
export function StaffEmploymentHistory({
  employments,
  className,
}: StaffEmploymentHistoryProps) {
  const { t, intlLocale } = useI18n();
  const prefs = useSettings();
  const formatDate = (value: string) =>
    formatDateWithSettings(value, prefs, intlLocale);

  return (
    <section
      className={cn(
        "min-w-0 rounded-xl border border-border/60 bg-card p-4",
        className,
      )}
    >
      <h2 className="font-heading mb-3 text-base font-semibold">
        {t("staff.history")}
      </h2>
      {employments.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          {t("staff.historyEmpty")}
        </p>
      ) : (
        <ol className="flex flex-col gap-2">
          {employments.map((employment) => {
            const open = employment.leaveDate === null;
            return (
              <li
                key={employment.id}
                className={cn(
                  "rounded-lg border px-3 py-2 text-sm",
                  open ? "border-primary/40 bg-primary/5" : "border-border/50",
                )}
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="font-medium tabular-nums">
                    {formatDate(employment.joinDate)} –{" "}
                    {employment.leaveDate
                      ? formatDate(employment.leaveDate)
                      : t("staff.present")}
                  </p>
                  <p className="text-muted-foreground text-xs tabular-nums">
                    {staffPayTypeLabel(employment.payType, t)} ·{" "}
                    {formatAmount(employment.salary, intlLocale)}
                  </p>
                </div>
                {employment.leaveReason ? (
                  <p className="text-muted-foreground mt-1 text-xs">
                    {t("staff.leaveReason")}: {employment.leaveReason}
                  </p>
                ) : null}
                {employment.notes ? (
                  <p className="text-muted-foreground mt-1 text-xs">
                    {employment.notes}
                  </p>
                ) : null}
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
