import { useParams } from "react-router";
import { CustomerDetailActions } from "~/features/customers/components/customer-detail-actions";
import { customerDetailOps } from "~/features/customers/ops";
import { useI18n } from "~/hooks/use-i18n";
import { Page } from "~/layouts";
import { OpsProvider } from "~/ops";
import type { Route } from "./+types/detail";

export function meta(_args: Route.MetaArgs) {
  return [{ title: "Customer · Moon Tailors" }];
}

export default function CustomerDetailPage() {
  const { t } = useI18n();
  const { id = "" } = useParams<{ id: string }>();

  return (
    <OpsProvider
      store={customerDetailOps}
      initialParams={{
        getCustomer: { id, _relations: ["measurement"] },
        listOrders: { customerId: id },
      }}
    >
      {({ store, components }) => (
        <Page
          title={t("customers.profile")}
          description={t("customers.profileHint")}
          actions={<CustomerDetailActions store={store} />}
        >
          {components.getCustomer}
        </Page>
      )}
    </OpsProvider>
  );
}
