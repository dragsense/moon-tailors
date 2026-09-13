import { useParams } from "react-router";
import { vendorDetailOps } from "~/features/vendors/ops";
import { useI18n } from "~/hooks/use-i18n";
import { Page } from "~/layouts";
import { OpsProvider } from "~/ops";

export function meta() {
  return [{ title: "Vendor · Moon Tailors" }];
}

export default function VendorDetailPage() {
  const { t } = useI18n();
  const { id = "" } = useParams<{ id: string }>();

  return (
    <OpsProvider store={vendorDetailOps} initialParams={{ getVendor: { id } }}>
      {({ components }) => (
        <Page title={t("vendors.profile")} description={t("vendors.profileHint")}>
          {components.getVendor}
        </Page>
      )}
    </OpsProvider>
  );
}
