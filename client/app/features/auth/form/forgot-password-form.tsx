import { useState } from "react";
import { Link, useNavigate } from "react-router";
import type { IAuthChallengeResponse } from "@template/contracts";
import { forgotPasswordSchema } from "@template/contracts";
import { SchemaForm } from "~/components/form-ui";
import { SurfaceCard } from "~/components/layout-ui";
import { PUBLIC_ROUTES } from "~/config";
import type { MutationOpComponentProps } from "~/ops";
import { isAuthChallenge } from "~/features/auth/api";
import { useAuthOptions } from "~/features/auth/hooks";
import { saveOtpChallenge } from "~/features/auth/session";

/** forgotPasswordPageOps.forgotPassword component. */
export function ForgotPasswordForm({
  submit,
  isPending,
  isError,
  error,
}: MutationOpComponentProps) {
  const navigate = useNavigate();
  const { data: options } = useAuthOptions();
  const [ack, setAck] = useState<string | null>(null);
  const mode = options?.passwordResetMode ?? "otp";

  return (
    <SurfaceCard
      className="mx-auto max-w-md"
      title="Forgot password"
      description={
        mode === "link"
          ? "Enter your email and we’ll send a reset link."
          : "Enter your email and we’ll send a one-time reset code."
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
        schema={forgotPasswordSchema}
        submitLabel={isPending ? "Sending…" : "Send reset"}
        onSubmit={async (values) => {
          setAck(null);
          await submit(values, undefined, {
            onSuccess: (res) => {
              if (mode === "otp" && isAuthChallenge(res)) {
                navigate(PUBLIC_ROUTES.RESET_PASSWORD, {
                  replace: true,
                  state: saveOtpChallenge(res as IAuthChallengeResponse),
                });
                return;
              }
              setAck(
                (res as { message?: string }).message ??
                  "If an account exists, reset instructions were sent.",
              );
            },
          });
        }}
      />
      {ack ? <p className="text-sm text-muted-foreground">{ack}</p> : null}
      {isError ? (
        <p className="text-sm text-destructive">
          {error instanceof Error ? error.message : "Request failed"}
        </p>
      ) : null}
    </SurfaceCard>
  );
}
