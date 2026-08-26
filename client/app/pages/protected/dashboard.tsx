import { Link } from "react-router";
import { Button } from "~/components/ui/button";
import { dashboardPageOps } from "~/features/dashboard/ops/list";
import { useI18n } from "~/hooks/use-i18n";
import { Page } from "~/layouts";
import { APP_ROUTES } from "~/config/routes.config";
import { OpsProvider } from "~/ops";
import type { Route } from "./+types/dashboard";

export function meta(_args: Route.MetaArgs) {
  return [{ title: "Dashboard · Moon Tailors" }];
}

export default function DashboardPage() {
  const { t } = useI18n();

  return (
    <Page
      title={t("dashboard.title")}
      description={t("dashboard.description")}
      actions={
        <Button asChild size="lg" variant="outline">
          <Link to={APP_ROUTES.ORDERS}>{t("nav.items.orders")}</Link>
        </Button>
      }
    >
      <OpsProvider store={dashboardPageOps} />
    </Page>
  );
}
