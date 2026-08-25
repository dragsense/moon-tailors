import { useI18n } from "~/hooks/use-i18n";
import { Page } from "~/layouts";
import type { QueryOpComponentProps } from "~/ops";
import { CustomerDirectory } from "./customer-directory";

export function CustomerList(props: QueryOpComponentProps) {
  const { t } = useI18n();

  return (
    <Page title={t("customers.title")} description={t("customers.description")}>
      <CustomerDirectory {...props} />
    </Page>
  );
}
