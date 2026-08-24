import type { IDashboardSummary } from "@moon-tailors/contracts";
import { Link } from "react-router";
import { Alert } from "~/components/layout-ui";
import { useI18n } from "~/hooks/use-i18n";
import { Page } from "~/layouts";
import type { QueryOpComponentProps } from "~/ops";
import { APP_ROUTES } from "~/config/routes.config";

export function DashboardView({
  data,
  isPending,
  isError,
  error,
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
    <Page
      title={t("dashboard.title")}
      description={t("dashboard.description")}
    >
      <div className="flex flex-col gap-8">
        <section className="flex flex-col gap-4">
          <h2 className="font-heading text-lg font-semibold">
            {t("dashboard.howTo")}
          </h2>
          <ol className="grid gap-4 sm:grid-cols-3">
            <li className="rounded-2xl border border-border/70 bg-card px-5 py-5">
              <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
                1
              </p>
              <p className="mt-2 text-lg font-semibold leading-snug">
                {t("dashboard.findCustomer")}
              </p>
              <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
                {t("dashboard.findCustomerHint")}
              </p>
            </li>
            <li className="rounded-2xl border border-border/70 bg-card px-5 py-5">
              <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
                2
              </p>
              <p className="mt-2 text-lg font-semibold leading-snug">
                {t("dashboard.openCustomer")}
              </p>
              <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
                {t("dashboard.openCustomerHint")}
              </p>
            </li>
            <li className="rounded-2xl border border-border/70 bg-card px-5 py-5">
              <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
                3
              </p>
              <p className="mt-2 text-lg font-semibold leading-snug">
                {t("dashboard.allOrders")}
              </p>
              <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
                {t("dashboard.allOrdersHint")}
              </p>
            </li>
          </ol>
          <div className="grid gap-3 sm:grid-cols-2">
            <Link
              to={APP_ROUTES.CUSTOMERS}
              className="flex min-h-16 items-center justify-center rounded-xl bg-primary px-6 py-4 text-center text-lg font-semibold text-primary-foreground shadow-sm hover:bg-primary/90"
            >
              {t("dashboard.findCustomer")}
            </Link>
            <Link
              to={APP_ROUTES.ORDERS}
              className="flex min-h-16 items-center justify-center rounded-xl border border-border bg-card px-6 py-4 text-center text-lg font-semibold hover:border-primary/40"
            >
              {t("dashboard.allOrders")}
            </Link>
          </div>
        </section>

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

        {summary ? (
          <>
            <section className="flex flex-col gap-3">
              <h2 className="font-heading text-lg font-semibold">
                {t("dashboard.glance")}
              </h2>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {summary.stats.map((stat) => (
                  <div
                    key={stat.key}
                    className="rounded-xl border border-border/60 bg-card px-5 py-4"
                  >
                    <p className="text-muted-foreground text-sm">{stat.label}</p>
                    <p className="mt-1 text-4xl font-semibold tracking-tight tabular-nums">
                      {stat.value}
                    </p>
                    {stat.hint ? (
                      <p className="text-muted-foreground mt-1 text-sm">
                        {stat.hint}
                      </p>
                    ) : null}
                  </div>
                ))}
              </div>
            </section>

            <section className="flex flex-col gap-3">
              <h2 className="font-heading text-lg font-semibold">
                {t("dashboard.activity")}
              </h2>
              <ul className="divide-border/60 divide-y rounded-xl border border-border/60 bg-card">
                {summary.activity.map((item) => (
                  <li key={item.id} className="px-5 py-4">
                    <p className="text-base font-medium">{item.title}</p>
                    {item.detail ? (
                      <p className="text-muted-foreground mt-0.5 text-sm">
                        {item.detail}
                      </p>
                    ) : null}
                    <p className="text-muted-foreground mt-1 text-xs tabular-nums">
                      {new Date(item.at).toLocaleString()}
                    </p>
                  </li>
                ))}
              </ul>
              <p className="text-muted-foreground text-xs">
                {t("dashboard.updatedAt", {
                  time: new Date(summary.generatedAt).toLocaleString(),
                })}
              </p>
            </section>
          </>
        ) : null}
      </div>
    </Page>
  );
}
