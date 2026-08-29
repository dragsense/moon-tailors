import type { IDashboardSummary } from "@moon-tailors/contracts";
import { Alert } from "~/components/layout-ui";
import { useI18n } from "~/hooks/use-i18n";
import { OpsComponent, type QueryOpComponentProps } from "~/ops";
import { DashboardStats } from "../components/dashboard-stats";

export function DashboardView({
  data,
  isPending,
  isError,
  error,
  store,
}: QueryOpComponentProps) {
  const { t } = useI18n();
  const summary = data as IDashboardSummary | undefined;
  const errorMessage =
    isError && error instanceof Error
      ? error.message
      : isError
        ? t("dashboard.loadError")
        : null;

  return (
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

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(16rem,20rem)] lg:items-start">
        <div className="min-w-0">
          <OpsComponent store={store} name="listCustomers" />
        </div>

        <aside className="hidden flex-col gap-4 lg:sticky lg:top-6 lg:flex">
          {summary ? <DashboardStats summary={summary} /> : null}
          <OpsComponent store={store} name="latestOrders" />
        </aside>
      </div>
    </div>
  );
}
