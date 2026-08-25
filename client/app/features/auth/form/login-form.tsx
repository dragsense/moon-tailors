import { useNavigate } from "react-router";
import type { ILoginResponse } from "@moon-tailors/contracts";
import { loginSchema } from "@moon-tailors/contracts";
import { SchemaForm } from "~/components/form-ui";
import { SurfaceCard } from "~/components/layout-ui";
import { LEVEL_HOME } from "~/config";
import type { MutationOpComponentProps } from "~/ops";
import { isLoginResponse } from "~/features/auth/api";
import { writeSession } from "~/features/auth/session";
import { useI18n } from "~/hooks/use-i18n";

/** loginPageOps.login component. */
export function LoginForm({
  submit,
  isPending,
  isError,
  error,
}: MutationOpComponentProps) {
  const { t } = useI18n();
  const navigate = useNavigate();

  return (
    <SurfaceCard
      className="mx-auto max-w-md"
      title={t("auth.loginTitle")}
      description={t("auth.loginHint")}
      contentClassName="space-y-4"
    >
      <SchemaForm
        schema={loginSchema}
        submitLabel={isPending ? t("auth.signingIn") : t("auth.signIn")}
        onSubmit={async (values) => {
          await submit(values, undefined, {
            onSuccess: (res) => {
              if (isLoginResponse(res)) {
                writeSession(res as ILoginResponse);
                navigate(LEVEL_HOME[res.user.level], { replace: true });
              }
            },
          });
        }}
      />
      {isError ? (
        <p className="text-sm text-destructive">
          {error instanceof Error ? error.message : t("auth.loginFailed")}
        </p>
      ) : null}
    </SurfaceCard>
  );
}
