import { EStaffPayType, type IStaff } from "@moon-tailors/contracts";
import { Link } from "react-router";
import { staffPath } from "~/config/routes.config";
import { CustomerAvatar } from "~/features/customers/components/customer-avatar";
import { useI18n } from "~/hooks/use-i18n";
import { formatAmount } from "~/lib/money";
import { staffPayTypeLabel } from "../lib/labels";

type StaffCardProps = {
  staff: IStaff;
};

export function StaffCard({ staff }: StaffCardProps) {
  const { t, intlLocale } = useI18n();

  return (
    <Link
      to={staffPath(staff.id)}
      className="group block min-w-0 overflow-hidden rounded-2xl bg-card p-4 shadow-sm ring-1 ring-border/70 transition-all hover:-translate-y-0.5 hover:shadow-md hover:ring-primary/40"
    >
      <div className="flex items-start gap-4">
        <CustomerAvatar
          customer={staff}
          size="lg"
          className="hidden size-16 text-base shadow-sm ring-2 ring-background sm:flex"
        />
        <div className="min-w-0 flex-1 space-y-3">
          <div className="min-w-0">
            <p className="text-muted-foreground truncate text-xs font-medium tracking-wide">
              {staff.role || t("staff.name")}
            </p>
            <p className="font-heading break-words text-lg font-semibold tracking-tight">
              {staff.name}
            </p>
          </div>

          <p className="truncate text-sm font-medium tabular-nums">
            {staff.phone}
          </p>

          <div className="rounded-lg border border-border/50 px-3 py-2">
            <p className="text-muted-foreground truncate text-xs font-medium tracking-wide">
              {staffPayTypeLabel(staff.payType, t)}
            </p>
            {/* On-demand staff have no salary — their totals live on each payment. */}
            {staff.payType === EStaffPayType.ON_DEMAND ? null : (
              <p className="truncate text-sm font-medium tabular-nums">
                {formatAmount(staff.salary, intlLocale)}
              </p>
            )}
            <p className="text-muted-foreground mt-1 truncate text-xs tabular-nums">
              {t("staff.totalPaid")}:{" "}
              <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                {formatAmount(staff.totalPaid, intlLocale)}
              </span>
            </p>
          </div>
        </div>
      </div>
    </Link>
  );
}
