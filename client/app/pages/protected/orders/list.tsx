import { OpsProvider } from "~/ops";
import { ordersListOps } from "~/features/orders/ops";
import { useI18n } from "~/hooks/use-i18n";
import { Page } from "~/layouts";
import type { Route } from "./+types/list";

export function meta(_args: Route.MetaArgs) {
  return [{ title: "Orders · Moon Tailors" }];
}

export default function OrdersPage() {
  const { t } = useI18n();

  return (
    <Page
      title={t("orders.title")}
      description={t("orders.description")}
      className="gap-8"
      contentClassName="space-y-6"
    >
      <OpsProvider store={ordersListOps}>
        {({ components }) => components.listOrders}
      </OpsProvider>
    </Page>
  );
}
