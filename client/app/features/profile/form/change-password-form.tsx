import { changePasswordSchema } from "@moon-tailors/contracts";
import { SchemaForm } from "~/components/form-ui";
import { CardPanel } from "~/components/layout-ui";
import { useI18n } from "~/hooks/use-i18n";
import type { MutationOpComponentProps } from "~/ops";

/** resetPasswordOps.changePassword component. */
export function ChangePasswordForm({
  submit,
  isPending,
  isError,
  error,
}: MutationOpComponentProps) {
  const { t } = useI18n();

  return (
    <div className="grid max-w-2xl gap-6">
      <CardPanel
        title={t("resetPassword.formTitle")}
        description={t("resetPassword.formDescription")}
      >
        <SchemaForm
          schema={changePasswordSchema}
          defaultValues={{
            currentPassword: "",
            newPassword: "",
            confirmPassword: "",
          }}
          submitLabel={
            isPending ? t("common.actions.loading") : t("resetPassword.submit")
          }
          onSubmit={async (values): Promise<void> => {
            await submit(values);
          }}
        />
        {isError ? (
          <p className="mt-3 text-sm text-destructive">
            {error instanceof Error
              ? error.message
              : t("resetPassword.failed")}
          </p>
        ) : null}
      </CardPanel>
    </div>
  );
}
