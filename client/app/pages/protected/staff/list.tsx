import { staffListOps } from "~/features/staff/ops";
import { useI18n } from "~/hooks/use-i18n";
import { Page } from "~/layouts";
import { OpsProvider } from "~/ops";

export function meta() {
  return [{ title: "Staff · Moon Tailors" }];
}

export default function StaffPage() {
  const { t } = useI18n();

  return (
    <OpsProvider store={staffListOps}>
      {({ components }) => (
        <Page title={t("staff.title")} description={t("staff.description")}>
          {components.listStaff}
        </Page>
      )}
    </OpsProvider>
  );
}
