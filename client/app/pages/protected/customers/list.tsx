import { customersListOps } from "~/features/customers/ops";
import { useI18n } from "~/hooks/use-i18n";
import { Page } from "~/layouts";
import { OpsProvider } from "~/ops";

export function meta() {
  return [{ title: "Customers · Moon Tailors" }];
}

export default function CustomersPage() {
  const { t } = useI18n();

  return (
    <OpsProvider store={customersListOps}>
      {({ components }) => (
        <Page
          title={t("customers.title")}
          description={t("customers.description")}
        >
          {components.listCustomers}
        </Page>
      )}
    </OpsProvider>
  );
}
