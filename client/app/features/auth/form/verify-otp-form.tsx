import { useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import type { ILoginResponse } from "@template/contracts";
import { verifyOtpSchema } from "@template/contracts";
import { SchemaForm } from "~/components/form-ui";
import { SurfaceCard } from "~/components/layout-ui";
import { LEVEL_HOME, PUBLIC_ROUTES } from "~/config";
import type { MutationOpComponentProps } from "~/ops";
import { useI18n } from "~/hooks/use-i18n";
import { getOrCreateDeviceId } from "~/features/auth/lib/device-id";
import {
  clearOtpChallenge,
  readOtpChallenge,
  writeSession,
  type OtpChallengeState,
} from "~/features/auth/session";

/** verifyOtpPageOps.verifyOtp component. */
export function VerifyOtpForm({
  submit,
  isPending,
  isError,
  error,
}: MutationOpComponentProps) {
  const { t } = useI18n();
  const navigate = useNavigate();
  const location = useLocation();
  const challenge =
    (location.state as OtpChallengeState | null) ?? readOtpChallenge();
  const challengeId = challenge?.challengeId ?? "";
  const purpose = challenge?.purpose ?? "login";
  const deviceId = getOrCreateDeviceId();
  const showRemember =
    purpose === "login" || purpose === "email_login" || purpose === "signup";

  useEffect(() => {
    if (!challengeId) {
      navigate(PUBLIC_ROUTES.LOGIN, { replace: true });
    }
  }, [challengeId, navigate]);

  return (
    <SurfaceCard
      className="mx-auto max-w-md"
      title="Verify OTP"
      description={
        purpose === "signup"
          ? "Enter the code to verify your account."
          : purpose === "email_login"
            ? "Enter the code we emailed you to sign in."
            : "Enter the code to finish signing in."
      }
      contentClassName="space-y-4"
      footer={
        <p className="text-sm text-muted-foreground">
          <Link
            to={PUBLIC_ROUTES.LOGIN}
            className="underline underline-offset-4"
          >
            Back to login
          </Link>
        </p>
      }
    >
      <SchemaForm
        schema={verifyOtpSchema}
        defaultValues={{
          challengeId,
          code: "",
          deviceId,
          rememberDevice: true,
        }}
        fieldConfig={{
          challengeId: { hidden: true },
          deviceId: { hidden: true },
          rememberDevice: showRemember
            ? {
                label: t("auth.rememberDevice"),
              }
            : { hidden: true },
        }}
        submitLabel={isPending ? "Verifying…" : "Verify"}
        onSubmit={async (values) => {
          await submit(
            {
              ...values,
              challengeId,
              deviceId: values.deviceId || deviceId,
            },
            undefined,
            {
              onSuccess: (res) => {
                const session = res as ILoginResponse;
                clearOtpChallenge();
                writeSession(session);
                navigate(LEVEL_HOME[session.user.level], { replace: true });
              },
            },
          );
        }}
      />
      {isError ? (
        <p className="text-sm text-destructive">
          {error instanceof Error ? error.message : "Verification failed"}
        </p>
      ) : null}
    </SurfaceCard>
  );
}
