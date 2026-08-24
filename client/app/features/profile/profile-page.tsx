import { useEffect, useState } from "react";
import {
  changePasswordSchema,
  updateMeSchema,
  type IMeUser,
  type TChangePasswordData,
  type TUpdateMeData,
} from "@moon-tailors/contracts";
import { SchemaForm } from "~/components/form-ui";
import { CardPanel } from "~/components/layout-ui";
import { useI18n } from "~/hooks/use-i18n";
import { Page } from "~/layouts";
import { useOp } from "~/ops";
import { profileOps } from "./ops";

export function ProfilePage() {
  const { t } = useI18n();
  const myProfile = useOp(profileOps, "myProfile");
  const updateMe = useOp(profileOps, "updateMe");
  const changePassword = useOp(profileOps, "changePassword");
  const [detailsFlash, setDetailsFlash] = useState(false);
  const [passwordFlash, setPasswordFlash] = useState(false);
  const [detailsError, setDetailsError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordFormKey, setPasswordFormKey] = useState(0);

  useEffect(() => {
    if (!detailsFlash) return;
    const id = window.setTimeout(() => setDetailsFlash(false), 2000);
    return () => window.clearTimeout(id);
  }, [detailsFlash]);

  useEffect(() => {
    if (!passwordFlash) return;
    const id = window.setTimeout(() => setPasswordFlash(false), 2000);
    return () => window.clearTimeout(id);
  }, [passwordFlash]);

  if (
    myProfile.kind !== "query" ||
    updateMe.kind !== "mutation" ||
    changePassword.kind !== "mutation"
  ) {
    return null;
  }

  const profile = myProfile.data as IMeUser | undefined;

  return (
    <Page title={t("profile.title")} description={t("profile.description")}>
      {myProfile.isPending && !profile ? (
        <p className="text-sm text-muted-foreground">
          {t("common.actions.loading")}
        </p>
      ) : null}

      <div className="grid max-w-2xl gap-6">
        <CardPanel
          title={t("profile.detailsTitle")}
          description={t("profile.detailsDescription")}
        >
          {profile ? (
            <SchemaForm
              key={profile.updatedAt}
              schema={updateMeSchema}
              defaultValues={{
                firstName: profile.firstName,
                lastName: profile.lastName,
                email: profile.email,
                age: profile.age,
                gender: profile.gender,
              }}
              submitLabel={t("profile.saveDetails")}
              onSubmit={async (values) => {
                setDetailsError(null);
                try {
                  await updateMe.run(values as TUpdateMeData);
                  setDetailsFlash(true);
                } catch (err) {
                  setDetailsError(
                    err instanceof Error
                      ? err.message
                      : t("profile.saveFailed"),
                  );
                }
              }}
            />
          ) : null}
          {detailsFlash ? (
            <p className="mt-3 text-sm text-muted-foreground">
              {t("profile.saved")}
            </p>
          ) : null}
          {detailsError ? (
            <p className="mt-3 text-sm text-destructive">{detailsError}</p>
          ) : null}
        </CardPanel>

        <CardPanel
          title={t("profile.passwordTitle")}
          description={t("profile.passwordDescription")}
        >
          <SchemaForm
            key={passwordFormKey}
            schema={changePasswordSchema}
            defaultValues={{
              currentPassword: "",
              newPassword: "",
              confirmPassword: "",
            }}
            submitLabel={t("profile.savePassword")}
            onSubmit={async (values) => {
              setPasswordError(null);
              const body = values as TChangePasswordData;
              if (body.newPassword !== body.confirmPassword) {
                setPasswordError(t("profile.mismatch"));
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
                    : t("profile.passwordFailed"),
                );
              }
            }}
          />
          {passwordFlash ? (
            <p className="mt-3 text-sm text-muted-foreground">
              {t("profile.passwordSaved")}
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
