import type { IDashboardSummary } from "@moon-tailors/contracts";
import { ClipboardListIcon } from "lucide-react";
import { useSearchParams } from "react-router";
import { Button } from "~/components/ui/button";
import { DASHBOARD_ORDERS_QUERY } from "~/config/routes.config";
import { DashboardGlanceMenu } from "~/features/dashboard/components/dashboard-glance-menu";
import { dashboardPageOps } from "~/features/dashboard/ops/list";
import { OrdersListModal } from "~/features/orders/list/orders-list-modal";
import { useI18n } from "~/hooks/use-i18n";
import { Page } from "~/layouts";
import { OpsProvider, useOp, type OpsStore } from "~/ops";
import type { Route } from "./+types/dashboard";

export function meta(_args: Route.MetaArgs) {
  return [{ title: "Dashboard · Moon Tailors" }];
}

function DashboardHeaderActions({ store }: { store: OpsStore }) {
  const { t } = useI18n();
  const [searchParams, setSearchParams] = useSearchParams();
  const ordersOpen = searchParams.get(DASHBOARD_ORDERS_QUERY) === "1";
  const summaryOp = useOp(store, "dashboardSummary");
  const summary =
    summaryOp.kind === "query"
      ? (summaryOp.data as IDashboardSummary | undefined)
      : undefined;

  function setOrdersOpen(open: boolean) {
    const next = new URLSearchParams(searchParams);
    if (open) next.set(DASHBOARD_ORDERS_QUERY, "1");
    else next.delete(DASHBOARD_ORDERS_QUERY);
    setSearchParams(next, { replace: true });
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <DashboardGlanceMenu store={store} summary={summary} />
        <Button
          type="button"
          size="lg"
          variant="outline"
          className="size-11 px-0 lg:h-11 lg:w-auto lg:px-5"
          aria-label={t("nav.items.orders")}
          aria-expanded={ordersOpen}
          onClick={() => setOrdersOpen(true)}
        >
          <ClipboardListIcon className="size-5" />
          <span className="hidden lg:inline">{t("nav.items.orders")}</span>
        </Button>
      </div>
      <OrdersListModal
        store={store}
        open={ordersOpen}
        onClose={() => setOrdersOpen(false)}
      />
    </>
  );
}

export default function DashboardPage() {
  const { t } = useI18n();

  return (
    <OpsProvider store={dashboardPageOps}>
      {({ store, components }) => (
        <Page
          title={t("dashboard.title")}
          description={t("dashboard.description")}
          actions={<DashboardHeaderActions store={store} />}
        >
          {components.dashboardSummary}
        </Page>
      )}
    </OpsProvider>
  );
}
