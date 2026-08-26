import { OpsProvider } from "~/ops";
import { profileOps } from "~/features/profile/ops";
import { useI18n } from "~/hooks/use-i18n";
import { Page } from "~/layouts";

export function meta() {
  return [{ title: "Profile" }];
}

export default function ProfileRoute() {
  const { t } = useI18n();

  return (
    <Page title={t("profile.title")} description={t("profile.description")}>
      <OpsProvider store={profileOps} />
    </Page>
  );
}
