import { useEffect } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router";
import {
  resetPasswordWithOtpSchema,
  resetPasswordWithTokenSchema,
} from "@template/contracts";
import { SchemaForm } from "~/components/form-ui";
import { SurfaceCard } from "~/components/layout-ui";
import { PUBLIC_ROUTES } from "~/config";
import type { MutationOpComponentProps } from "~/ops";
import { useAuthOptions } from "~/features/auth/hooks";
import {
  clearOtpChallenge,
  readOtpChallenge,
  type OtpChallengeState,
} from "~/features/auth/session";

/** resetPasswordPageOps.resetPassword component. */
export function ResetPasswordForm({
  submit,
  isPending,
  isError,
  error,
}: MutationOpComponentProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();
  const { data: options } = useAuthOptions();
  const mode = options?.passwordResetMode ?? "otp";

  const challenge =
    (location.state as OtpChallengeState | null) ?? readOtpChallenge();
  const challengeId = challenge?.challengeId ?? "";
  const token = params.get("token") ?? "";

  useEffect(() => {
    if (mode === "otp" && !challengeId) {
      navigate(PUBLIC_ROUTES.FORGOT_PASSWORD, { replace: true });
    }
    if (mode === "link" && !token) {
      navigate(PUBLIC_ROUTES.FORGOT_PASSWORD, { replace: true });
    }
  }, [mode, challengeId, token, navigate]);

  if (mode === "link") {
    return (
      <SurfaceCard
        className="mx-auto max-w-md"
        title="Reset password"
        description="Choose a new password for your account."
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
          schema={resetPasswordWithTokenSchema}
          defaultValues={{ token, password: "" }}
          fieldConfig={{ token: { hidden: true } }}
          submitLabel={isPending ? "Saving…" : "Update password"}
          onSubmit={async (values) => {
            await submit(
              { ...values, token },
              undefined,
              {
                onSuccess: () => {
                  navigate(PUBLIC_ROUTES.LOGIN, { replace: true });
                },
              },
            );
          }}
        />
        {isError ? (
          <p className="text-sm text-destructive">
            {error instanceof Error ? error.message : "Reset failed"}
          </p>
        ) : null}
      </SurfaceCard>
    );
  }

  return (
    <SurfaceCard
      className="mx-auto max-w-md"
      title="Reset password"
      description="Enter the OTP from your email and choose a new password."
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
        schema={resetPasswordWithOtpSchema}
        defaultValues={{
          challengeId,
          code: "",
          password: "",
        }}
        fieldConfig={{
          challengeId: { hidden: true },
        }}
        submitLabel={isPending ? "Saving…" : "Update password"}
        onSubmit={async (values) => {
          await submit(
            { ...values, challengeId },
            undefined,
            {
              onSuccess: () => {
                clearOtpChallenge();
                navigate(PUBLIC_ROUTES.LOGIN, { replace: true });
              },
            },
          );
        }}
      />
      {isError ? (
        <p className="text-sm text-destructive">
          {error instanceof Error ? error.message : "Reset failed"}
        </p>
      ) : null}
    </SurfaceCard>
  );
}
