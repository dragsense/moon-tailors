import { OpsProvider } from "~/ops";
import { settingsPageOps } from "~/features/settings/ops";
import { useI18n } from "~/hooks/use-i18n";
import { Page } from "~/layouts";

export function meta() {
  return [{ title: "Settings" }];
}

export default function SettingsRoute() {
  const { t } = useI18n();

  return (
    <Page title={t("settings.title")} description={t("settings.description")}>
      <OpsProvider store={settingsPageOps} />
    </Page>
  );
}
