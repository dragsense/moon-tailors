import type { IDashboardSummary } from "@template/contracts";
import { Alert } from "~/components/layout-ui";
import { useI18n } from "~/hooks/use-i18n";
import { Page } from "~/layouts";
import type { QueryOpComponentProps } from "~/ops";

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
    <Page description={t("dashboard.description")}>
      <div className="flex flex-col gap-6">
        {errorMessage ? (
          <Alert title={t("dashboard.loadError")} tone="danger">
            {errorMessage}
          </Alert>
        ) : null}

        {isPending && !summary ? (
          <p className="text-muted-foreground text-sm">
            {t("dashboard.loading")}
          </p>
        ) : null}

        {summary ? (
          <>
            <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {summary.stats.map((stat) => (
                <div
                  key={stat.key}
                  className="rounded-xl border border-border/60 bg-card/40 px-4 py-3"
                >
                  <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                    {stat.label}
                  </p>
                  <p className="mt-1 text-3xl font-semibold tracking-tight tabular-nums">
                    {stat.value}
                  </p>
                  {stat.hint ? (
                    <p className="text-muted-foreground mt-1 text-xs">
                      {stat.hint}
                    </p>
                  ) : null}
                </div>
              ))}
            </section>

            <section className="flex flex-col gap-3">
              <h2 className="text-sm font-semibold tracking-tight">
                {t("dashboard.activity")}
              </h2>
              <ul className="divide-border/60 divide-y rounded-xl border border-border/60">
                {summary.activity.map((item) => (
                  <li key={item.id} className="px-4 py-3">
                    <p className="text-sm font-medium">{item.title}</p>
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
