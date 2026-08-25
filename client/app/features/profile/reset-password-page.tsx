import { useEffect, useState } from "react";
import {
  changePasswordSchema,
  type TChangePasswordData,
} from "@moon-tailors/contracts";
import { SchemaForm } from "~/components/form-ui";
import { CardPanel } from "~/components/layout-ui";
import { useI18n } from "~/hooks/use-i18n";
import { Page } from "~/layouts";
import { useOp } from "~/ops";
import { resetPasswordOps } from "./ops";

export function ResetPasswordPage() {
  const { t } = useI18n();
  const changePassword = useOp(resetPasswordOps, "changePassword");
  const [passwordFlash, setPasswordFlash] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordFormKey, setPasswordFormKey] = useState(0);

  useEffect(() => {
    if (!passwordFlash) return;
    const id = window.setTimeout(() => setPasswordFlash(false), 2000);
    return () => window.clearTimeout(id);
  }, [passwordFlash]);

  if (changePassword.kind !== "mutation") return null;

  return (
    <Page
      title={t("resetPassword.title")}
      description={t("resetPassword.description")}
    >
      <div className="grid max-w-2xl gap-6">
        <CardPanel
          title={t("resetPassword.formTitle")}
          description={t("resetPassword.formDescription")}
        >
          <SchemaForm
            key={passwordFormKey}
            schema={changePasswordSchema}
            defaultValues={{
              currentPassword: "",
              newPassword: "",
              confirmPassword: "",
            }}
            submitLabel={t("resetPassword.submit")}
            onSubmit={async (values) => {
              setPasswordError(null);
              const body = values as TChangePasswordData;
              if (body.newPassword !== body.confirmPassword) {
                setPasswordError(t("resetPassword.mismatch"));
                return;
              }
              try {
                await changePassword.run(body);
                setPasswordFlash(true);
                setPasswordFormKey((key) => key + 1);
              } catch (err) {
                setPasswordError(
                  err instanceof Error
                    ? err.message
                    : t("resetPassword.failed"),
                );
              }
            }}
          />
          {passwordFlash ? (
            <p className="mt-3 text-sm text-muted-foreground">
              {t("resetPassword.saved")}
            </p>
          ) : null}
          {passwordError ? (
            <p className="mt-3 text-sm text-destructive">{passwordError}</p>
          ) : null}
        </CardPanel>
      </div>
    </Page>
  );
}
