import type { IDashboardSummary } from "@moon-tailors/contracts";
import { Link } from "react-router";
import { CompactAmount } from "~/components/compact-amount";
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

type Stat = IDashboardSummary["stats"][number];
type Tone = NonNullable<Stat["tone"]>;

/** Shown in the banner above the grid instead of as a card. */
const HIDDEN_STAT_KEYS = new Set(["delayed"]);

/** Cards that keep their plain-text hint (e.g. staff: fixed · on demand). */
const SHOW_HINT_KEYS = new Set(["staff"]);

const cardToneClass: Record<Tone, string> = {
  default: "border-border/60 bg-background",
  success:
    "border-emerald-300/80 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950",
  danger: "border-red-300/80 bg-red-50 dark:border-red-800 dark:bg-red-950",
};

const textToneClass: Record<Tone, string> = {
  default: "",
  success: "text-emerald-700 dark:text-emerald-400",
  danger: "text-red-700 dark:text-red-400",
};

function StatCard({ stat, intlLocale }: { stat: Stat; intlLocale?: string }) {
  const tone = stat.tone ?? "default";

  return (
    <div
      className={cn(
        "flex min-w-0 flex-col gap-1 rounded-lg border px-3 py-2.5 shadow-sm",
        cardToneClass[tone],
      )}
    >
      <p className="text-muted-foreground break-words text-xs font-medium leading-tight">
        {stat.label}
      </p>
      <p
        className={cn(
          "break-words text-lg font-semibold leading-snug tabular-nums tracking-tight lg:text-xl",
          textToneClass[tone],
        )}
      >
        {stat.currency ? (
          // Big money shortened ("PKR 1.13M"); tooltip shows the exact amount.
          <CompactAmount
            value={stat.value}
            currency={stat.currency}
            label={stat.label}
          />
        ) : (
          stat.value.toLocaleString(intlLocale)
        )}
      </p>
      {stat.subValue !== undefined ? (
        <p
          className={cn(
            "break-words text-xs font-medium leading-tight",
            stat.subTone && stat.subTone !== "default"
              ? textToneClass[stat.subTone]
              : "text-muted-foreground",
          )}
        >
          {stat.subLabel ? `${stat.subLabel} ` : ""}
          <CompactAmount
            value={stat.subValue}
            currency={stat.subCurrency ?? null}
            label={
              stat.subLabel ? `${stat.label} · ${stat.subLabel}` : stat.label
            }
          />
        </p>
      ) : stat.hint && SHOW_HINT_KEYS.has(stat.key) ? (
        <p className="text-muted-foreground break-words text-xs leading-tight">
          {stat.hint}
        </p>
      ) : null}
    </div>
  );
}

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
    <section className="flex min-w-0 flex-col gap-2.5 rounded-xl border border-border/60 bg-card p-3 sm:p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-heading text-base font-semibold">
          {t("dashboard.glance")}
        </h2>
        <p className="text-muted-foreground text-xs tabular-nums">
          {generatedAt}
        </p>
      </div>

      <Link
        to={dashboardOrdersPath({ delayed: delayed > 0 })}
        className={cn(
          "rounded-lg border px-3 py-2 text-sm transition-colors hover:border-primary/40",
          delayed > 0
            ? "border-destructive/40 bg-destructive/5"
            : "border-emerald-300/80 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950",
        )}
      >
        <p
          className={cn(
            "font-medium leading-snug",
            delayed > 0
              ? "text-destructive"
              : "text-emerald-700 dark:text-emerald-400",
          )}
        >
          {delayed > 0
            ? t("dashboard.delayedCount", { count: delayed })
            : t("dashboard.onSchedule")}
        </p>
      </Link>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-8">
        {summary.stats
          .filter((stat) => !HIDDEN_STAT_KEYS.has(stat.key))
          .map((stat) => (
            <StatCard key={stat.key} stat={stat} intlLocale={intlLocale} />
          ))}
      </div>
    </section>
  );
}
