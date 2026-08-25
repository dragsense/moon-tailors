import type { IDashboardSummary } from "@moon-tailors/contracts";
import { Link } from "react-router";
import { Alert } from "~/components/layout-ui";
import { CustomerDirectory } from "~/features/customers/list/customer-directory";
import {
  formatDateTimeWithSettings,
  settingsOps,
} from "~/features/settings";
import { useI18n } from "~/hooks/use-i18n";
import { Page } from "~/layouts";
import { cn } from "~/lib/utils";
import { APP_ROUTES } from "~/config/routes.config";
import { useOp, type QueryOpComponentProps } from "~/ops";

export function DashboardView({
  data,
  isPending,
  isError,
  error,
  store,
}: QueryOpComponentProps) {
  const { t, intlLocale } = useI18n();
  const listCustomers = useOp(store, "listCustomers");
  const mySettings = useOp(settingsOps, "mySettings");
  const summary = data as IDashboardSummary | undefined;
  const prefsData = mySettings.kind === "query" ? mySettings.data : undefined;
  const errorMessage =
    isError && error instanceof Error
      ? error.message
      : isError
        ? t("dashboard.loadError")
        : null;
  const delayed =
    summary?.stats.find((stat) => stat.key === "delayed")?.value ?? 0;

  return (
    <Page title={t("dashboard.title")} description={t("dashboard.description")}>
      <div className="flex flex-col gap-6">
        {errorMessage ? (
          <Alert title={t("dashboard.loadError")} tone="danger">
            {errorMessage}
          </Alert>
        ) : null}

        {isPending && !summary ? (
          <p className="text-muted-foreground text-base">
            {t("dashboard.loading")}
          </p>
        ) : null}

        {listCustomers.kind === "query" && listCustomers.allowed ? (
          <CustomerDirectory
            store={store}
            data={listCustomers.data}
            error={listCustomers.error}
            isPending={listCustomers.isPending}
            isError={listCustomers.isError}
            params={listCustomers.params}
            setParams={listCustomers.setParams}
            refetch={listCustomers.refetch}
            afterSearch={
              summary ? (
                <DashboardStatus
                  summary={summary}
                  delayed={delayed}
                  generatedAt={formatDateTimeWithSettings(
                    summary.generatedAt,
                    prefsData,
                    intlLocale,
                  )}
                />
              ) : null
            }
          />
        ) : summary ? (
          <DashboardStatus
            summary={summary}
            delayed={delayed}
            generatedAt={formatDateTimeWithSettings(
              summary.generatedAt,
              prefsData,
              intlLocale,
            )}
          />
        ) : null}
      </div>
    </Page>
  );
}

function DashboardStatus({
  summary,
  delayed,
  generatedAt,
}: {
  summary: IDashboardSummary;
  delayed: number;
  generatedAt: string;
}) {
  const { t } = useI18n();

  return (
    <div className="flex flex-col gap-3">
      <Link
        to={APP_ROUTES.ORDERS}
        className={cn(
          "rounded-lg border px-3 py-2 text-sm transition-colors hover:border-primary/40",
          delayed > 0
            ? "border-destructive/40 bg-destructive/5"
            : "border-border/60 bg-card",
        )}
      >
        <p className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:gap-2">
          <span className="text-muted-foreground shrink-0 text-xs tabular-nums">
            {generatedAt}
          </span>
          <span className="font-medium">
            {delayed > 0
              ? t("dashboard.delayedCount", { count: delayed })
              : t("dashboard.onSchedule")}
          </span>
        </p>
      </Link>
      <div className="grid grid-cols-2 gap-2 xl:grid-cols-4">
        {summary.stats.map((stat) => (
          <div
            key={stat.key}
            className="rounded-lg border border-border/60 bg-card px-3 py-2"
          >
            <p className="text-muted-foreground text-xs">{stat.label}</p>
            <p className="text-xl font-semibold tracking-tight tabular-nums">
              {stat.value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
