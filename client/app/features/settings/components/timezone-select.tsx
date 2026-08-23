import { GlobeIcon } from "lucide-react";
import { Label } from "~/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { useI18n } from "~/hooks/use-i18n";
import { getBrowserTimezone, setPreferredTimezone } from "~/lib/api";
import { useOp } from "~/ops";
import { cn } from "~/lib/utils";
import { resolvePreferences } from "../lib/preferences";
import {
  DEVICE_TIMEZONE_VALUE,
  listTimezoneOptions,
  resolveTimezone,
} from "../lib/timezone";
import { settingsOps } from "../ops";

export type TimezoneSelectProps = {
  /** `full` = settings page field; `compact` = header control. */
  variant?: "full" | "compact";
  className?: string;
  disabled?: boolean;
};

/**
 * Timezone picker.
 * - Value `null` / device option → use browser timezone.
 * - Device zone is only the dedicated first option (not duplicated in the list).
 */
export function TimezoneSelect({
  variant = "full",
  className,
  disabled,
}: TimezoneSelectProps) {
  const { t } = useI18n();
  const mySettings = useOp(settingsOps, "mySettings");
  const saveSettings = useOp(settingsOps, "saveSettings");
  const preferences = resolvePreferences(
    mySettings.kind === "query" ? mySettings.data : undefined,
  );
  const deviceTz = getBrowserTimezone();
  const effectiveTz = resolveTimezone(preferences);
  const savedTz = preferences.time.timezone;
  const options = listTimezoneOptions(deviceTz).filter((tz) => tz !== deviceTz);
  const selectValue =
    !savedTz || savedTz === deviceTz || !options.includes(savedTz)
      ? DEVICE_TIMEZONE_VALUE
      : savedTz;
  const isPending =
    saveSettings.kind === "mutation" && saveSettings.isPending;

  const statusText =
    savedTz && savedTz !== deviceTz
      ? t("settings.time.timezoneUsing", { tz: effectiveTz })
      : t("settings.time.timezoneUsingDevice", { tz: effectiveTz });

  const onChange = async (value: string) => {
    if (saveSettings.kind !== "mutation") return;
    const timezone =
      value === DEVICE_TIMEZONE_VALUE || value === deviceTz ? null : value;
    setPreferredTimezone(timezone);
    await saveSettings.run({
      time: { ...preferences.time, timezone },
    });
  };

  const trigger = (
    <Select
      value={selectValue}
      onValueChange={(value) => void onChange(value)}
      disabled={disabled || isPending}
    >
      <SelectTrigger
        className={cn(
          variant === "compact" ? "h-8 w-[11rem] text-xs" : "w-full max-w-md",
        )}
      >
        {variant === "compact" ? (
          <span className="flex min-w-0 items-center gap-1.5">
            <GlobeIcon className="h-3.5 w-3.5 shrink-0 opacity-70" />
            <SelectValue placeholder={effectiveTz} />
          </span>
        ) : (
          <SelectValue />
        )}
      </SelectTrigger>
      <SelectContent
        position="popper"
        side="bottom"
        align="start"
        sideOffset={6}
        className="max-h-72 z-[100]"
      >
        <SelectItem value={DEVICE_TIMEZONE_VALUE}>
          {t("settings.time.timezoneDevice", { tz: deviceTz })}
        </SelectItem>
        {options.map((tz) => (
          <SelectItem key={tz} value={tz}>
            {tz}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );

  if (variant === "compact") {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <span className="max-w-[10rem] truncate text-start text-[10px] text-muted-foreground">
          {statusText}
        </span>
        {trigger}
      </div>
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      <Label>{t("settings.time.timezone")}</Label>
      <p className="text-xs text-muted-foreground">
        {t("settings.time.timezoneHint")}
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <p className="text-xs text-muted-foreground">{statusText}</p>
        {trigger}
      </div>
    </div>
  );
}
