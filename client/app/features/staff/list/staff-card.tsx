import { EStaffStatus, type IStaff } from "@moon-tailors/contracts";
import { Link } from "react-router";
import { staffPath } from "~/config/routes.config";
import { CustomerAvatar } from "~/features/customers/components/customer-avatar";
import { formatDateWithSettings, useSettings } from "~/features/settings";
import { useI18n } from "~/hooks/use-i18n";
import { formatAmount } from "~/lib/money";
import { cn } from "~/lib/utils";
import { StaffStatusBadge } from "../components/staff-status-badge";
import { staffPayTypeLabel } from "../lib/labels";

type StaffCardProps = {
  staff: IStaff;
};

export function StaffCard({ staff }: StaffCardProps) {
  const { t, intlLocale } = useI18n();
  const prefs = useSettings();
  const hasLeft = staff.status === EStaffStatus.LEFT;
  const last = staff.currentEmployment;
  const formatDate = (value: string) =>
    formatDateWithSettings(value, prefs, intlLocale);

  return (
    <Link
      to={staffPath(staff.id)}
      className={cn(
        "group block min-w-0 overflow-hidden rounded-2xl bg-card p-4 shadow-sm ring-1 ring-border/70 transition-all hover:-translate-y-0.5 hover:shadow-md hover:ring-primary/40",
        hasLeft && "bg-muted/30",
      )}
    >
      <div className="flex items-start gap-4">
        <CustomerAvatar
          customer={staff}
          size="lg"
          className="hidden size-16 text-base shadow-sm ring-2 ring-background sm:flex"
        />
        <div className="min-w-0 flex-1 space-y-3">
          <div className="flex min-w-0 items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-muted-foreground truncate text-xs font-medium tracking-wide">
                {staff.role || t("staff.name")}
              </p>
              <p className="font-heading break-words text-lg font-semibold tracking-tight">
                {staff.name}
              </p>
            </div>
            <StaffStatusBadge status={staff.status} />
          </div>

          <p className="truncate text-sm font-medium tabular-nums">
            {staff.phone}
          </p>

          <div className="rounded-lg border border-border/50 px-3 py-2">
            <p className="text-muted-foreground text-xs font-medium tracking-wide">
              {t("staff.lastPeriod")}
            </p>
            {last ? (
              <>
                <p className="truncate text-sm font-medium tabular-nums">
                  {formatDate(last.joinDate)} –{" "}
                  {last.leaveDate
                    ? formatDate(last.leaveDate)
                    : t("staff.present")}
                </p>
                <p className="text-muted-foreground truncate text-xs tabular-nums">
                  {staffPayTypeLabel(last.payType, t)} ·{" "}
                  {formatAmount(last.salary, intlLocale)}
                </p>
              </>
            ) : (
              <p className="text-muted-foreground text-sm">—</p>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
