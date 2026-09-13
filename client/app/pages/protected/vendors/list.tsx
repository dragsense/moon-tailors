import { vendorsListOps } from "~/features/vendors/ops";
import { useI18n } from "~/hooks/use-i18n";
import { Page } from "~/layouts";
import { OpsProvider } from "~/ops";

export function meta() {
  return [{ title: "Vendors · Moon Tailors" }];
}

export default function VendorsPage() {
  const { t } = useI18n();

  return (
    <OpsProvider store={vendorsListOps}>
      {({ components }) => (
        <Page title={t("vendors.title")} description={t("vendors.description")}>
          {components.listVendors}
        </Page>
      )}
    </OpsProvider>
  );
}
