import { OpsProvider } from "~/ops";
import { resetPasswordOps } from "~/features/profile/ops";
import { useI18n } from "~/hooks/use-i18n";
import { Page } from "~/layouts";

export function meta() {
  return [{ title: "Reset password" }];
}

export default function ResetPasswordRoute() {
  const { t } = useI18n();

  return (
    <Page
      title={t("resetPassword.title")}
      description={t("resetPassword.description")}
    >
      <OpsProvider store={resetPasswordOps} />
    </Page>
  );
}
