import { XIcon } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { useI18n } from "~/hooks/use-i18n";

export type DateRange = { from: string; to: string };

export const EMPTY_DATE_RANGE: DateRange = { from: "", to: "" };

/** ISO `YYYY-MM-DD` strings compare correctly as text; empty ends are open. */
export function inDateRange(date: string, range: DateRange): boolean {
  if (range.from && date < range.from) return false;
  if (range.to && date > range.to) return false;
  return true;
}

export function isDateRangeActive(range: DateRange): boolean {
  return Boolean(range.from || range.to);
}

type DateRangeFilterProps = {
  id: string;
  value: DateRange;
  onChange: (range: DateRange) => void;
};

export function DateRangeFilter({ id, value, onChange }: DateRangeFilterProps) {
  const { t } = useI18n();

  return (
    <div className="flex flex-wrap items-end gap-2">
      <div className="min-w-0 flex-1 space-y-1 sm:flex-none">
        <Label htmlFor={`${id}-from`} className="text-xs">
          {t("vendors.dateFrom")}
        </Label>
        <Input
          id={`${id}-from`}
          type="date"
          className="h-8 w-full sm:w-36"
          value={value.from}
          max={value.to || undefined}
          onChange={(event) => onChange({ ...value, from: event.target.value })}
        />
      </div>
      <div className="min-w-0 flex-1 space-y-1 sm:flex-none">
        <Label htmlFor={`${id}-to`} className="text-xs">
          {t("vendors.dateTo")}
        </Label>
        <Input
          id={`${id}-to`}
          type="date"
          className="h-8 w-full sm:w-36"
          value={value.to}
          min={value.from || undefined}
          onChange={(event) => onChange({ ...value, to: event.target.value })}
        />
      </div>
      {isDateRangeActive(value) ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8"
          onClick={() => onChange(EMPTY_DATE_RANGE)}
        >
          <XIcon className="size-4" />
          {t("vendors.clearDates")}
        </Button>
      ) : null}
    </div>
  );
}
