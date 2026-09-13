import { useParams } from "react-router";
import { staffDetailOps } from "~/features/staff/ops";
import { useI18n } from "~/hooks/use-i18n";
import { Page } from "~/layouts";
import { OpsProvider } from "~/ops";

export function meta() {
  return [{ title: "Staff member · Moon Tailors" }];
}

export default function StaffDetailPage() {
  const { t } = useI18n();
  const { id = "" } = useParams<{ id: string }>();

  return (
    <OpsProvider store={staffDetailOps} initialParams={{ getStaff: { id } }}>
      {({ components }) => (
        <Page title={t("staff.profile")} description={t("staff.profileHint")}>
          {components.getStaff}
        </Page>
      )}
    </OpsProvider>
  );
}
