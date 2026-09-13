import { useEffect } from "react";
import type { LucideIcon } from "lucide-react";
import {
  ClipboardListIcon,
  ContactIcon,
  TruckIcon,
  UsersIcon,
} from "lucide-react";
import { Link, useSearchParams } from "react-router";
import { Button } from "~/components/ui/button";
import {
  APP_ROUTES,
  canAccessRoute,
  DASHBOARD_DELAYED_QUERY,
  DASHBOARD_ORDERS_QUERY,
} from "~/config/routes.config";
import { useSession } from "~/features/auth/hooks/use-session";
import { dashboardPageOps } from "~/features/dashboard/ops/list";
import { OrdersListModal } from "~/features/orders/list/orders-list-modal";
import { useI18n } from "~/hooks/use-i18n";
import { Page } from "~/layouts";
import { OpsProvider, type OpsStore } from "~/ops";
import type { Route } from "./+types/dashboard";

export function meta(_args: Route.MetaArgs) {
  return [{ title: "Dashboard · Moon Tailors" }];
}

const headerButtonClass = "size-11 px-0 lg:h-11 lg:w-auto lg:px-5";

/** Icon-only on phones, icon + label on desktop. */
function HeaderLink({
  to,
  label,
  icon: Icon,
}: {
  to: string;
  label: string;
  icon: LucideIcon;
}) {
  return (
    <Button asChild size="lg" variant="outline" className={headerButtonClass}>
      <Link to={to} aria-label={label}>
        <Icon className="size-5" />
        <span className="hidden lg:inline">{label}</span>
      </Link>
    </Button>
  );
}

function DashboardHeaderActions({ store }: { store: OpsStore }) {
  const { t } = useI18n();
  const [searchParams, setSearchParams] = useSearchParams();
  const ordersOpen = searchParams.get(DASHBOARD_ORDERS_QUERY) === "1";
  const lateOnly = searchParams.get(DASHBOARD_DELAYED_QUERY) === "1";
  const session = useSession();
  const user = session?.user;

  // Opened from the delayed banner → "Late only" pre-applied; from the header → all orders.
  useEffect(() => {
    if (!ordersOpen) return;
    store.getState().setParams("listOrders", {
      page: 1,
      delayed: lateOnly ? true : undefined,
    });
  }, [ordersOpen, lateOnly, store]);

  function setOrdersOpen(open: boolean) {
    const next = new URLSearchParams(searchParams);
    if (open) next.set(DASHBOARD_ORDERS_QUERY, "1");
    else next.delete(DASHBOARD_ORDERS_QUERY);
    next.delete(DASHBOARD_DELAYED_QUERY);
    setSearchParams(next, { replace: true });
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        {canAccessRoute(APP_ROUTES.CUSTOMERS, user) ? (
          <HeaderLink
            to={APP_ROUTES.CUSTOMERS}
            label={t("nav.items.customers")}
            icon={ContactIcon}
          />
        ) : null}
        {canAccessRoute(APP_ROUTES.STAFF, user) ? (
          <HeaderLink
            to={APP_ROUTES.STAFF}
            label={t("nav.items.staff")}
            icon={UsersIcon}
          />
        ) : null}
        {canAccessRoute(APP_ROUTES.VENDORS, user) ? (
          <HeaderLink
            to={APP_ROUTES.VENDORS}
            label={t("nav.items.vendors")}
            icon={TruckIcon}
          />
        ) : null}
        <Button
          type="button"
          size="lg"
          variant="outline"
          className={headerButtonClass}
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
