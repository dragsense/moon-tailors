import { EStaffStatus } from "@moon-tailors/contracts";
import { useI18n } from "~/hooks/use-i18n";
import { cn } from "~/lib/utils";
import { staffStatusLabel } from "../lib/labels";

type StaffStatusBadgeProps = {
  status: EStaffStatus;
  className?: string;
};

export function StaffStatusBadge({ status, className }: StaffStatusBadgeProps) {
  const { t } = useI18n();
  const hasLeft = status === EStaffStatus.LEFT;

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-xs font-medium",
        hasLeft ? "bg-slate-500 text-white" : "bg-emerald-700 text-white",
        className,
      )}
    >
      {staffStatusLabel(status, t)}
    </span>
  );
}
