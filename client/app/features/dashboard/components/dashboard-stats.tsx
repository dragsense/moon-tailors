import type { IDashboardSummary } from "@moon-tailors/contracts";
import { Link } from "react-router";
import {
  formatDateTimeWithSettings,
  useSettings,
} from "~/features/settings";
import { useI18n } from "~/hooks/use-i18n";
import { cn } from "~/lib/utils";
import { dashboardOrdersPath } from "~/config/routes.config";

type DashboardStatsProps = {
  summary: IDashboardSummary;
};

export function DashboardStats({ summary }: DashboardStatsProps) {
  const { t, intlLocale } = useI18n();
  const prefs = useSettings();
  const delayed =
    summary.stats.find((stat) => stat.key === "delayed")?.value ?? 0;
  const generatedAt = formatDateTimeWithSettings(
    summary.generatedAt,
    prefs,
    intlLocale,
  );

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border/60 bg-card p-3">
      <div>
        <h2 className="font-heading text-sm font-semibold">
          {t("dashboard.glance")}
        </h2>
        <p className="text-muted-foreground text-xs tabular-nums">
          {generatedAt}
        </p>
      </div>

      <Link
        to={dashboardOrdersPath()}
        className={cn(
          "rounded-lg border px-3 py-2 text-sm transition-colors hover:border-primary/40",
          delayed > 0
            ? "border-destructive/40 bg-destructive/5"
            : "border-border/50",
        )}
      >
        <p className="font-medium leading-snug">
          {delayed > 0
            ? t("dashboard.delayedCount", { count: delayed })
            : t("dashboard.onSchedule")}
        </p>
      </Link>

      <ul className="flex flex-col gap-2">
        {summary.stats.map((stat) => (
          <li
            key={stat.key}
            className="flex items-baseline justify-between gap-3 border-b border-border/40 pb-2 last:border-b-0 last:pb-0"
          >
            <span className="text-muted-foreground text-xs">{stat.label}</span>
            <span className="text-lg font-semibold tabular-nums tracking-tight">
              {stat.value}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
