import { useState } from "react";
import { Link, useNavigate } from "react-router";
import type { IAuthChallengeResponse } from "@template/contracts";
import { emailLoginSchema } from "@template/contracts";
import { SchemaForm } from "~/components/form-ui";
import { SurfaceCard } from "~/components/layout-ui";
import { PUBLIC_ROUTES } from "~/config";
import type { MutationOpComponentProps } from "~/ops";
import { isAuthChallenge } from "~/features/auth/api";
import { useAuthOptions } from "~/features/auth/hooks";
import { getOrCreateDeviceId } from "~/features/auth/lib/device-id";
import { saveOtpChallenge } from "~/features/auth/session";

/** emailLoginPageOps.emailLogin component. */
export function EmailLoginForm({
  submit,
  isPending,
  isError,
  error,
}: MutationOpComponentProps) {
  const navigate = useNavigate();
  const { data: options } = useAuthOptions();
  const [ack, setAck] = useState<string | null>(null);

  if (options && !options.loginEmailOtp) {
    return (
      <SurfaceCard
        className="mx-auto max-w-md"
        title="Email login"
        description="Email OTP login is disabled on this server."
        footer={
          <Link
            to={PUBLIC_ROUTES.LOGIN}
            className="text-sm underline underline-offset-4"
          >
            Back to login
          </Link>
        }
      />
    );
  }

  return (
    <SurfaceCard
      className="mx-auto max-w-md"
      title="Login with email OTP"
      description="We’ll email a one-time code — no password needed."
      contentClassName="space-y-4"
      footer={
        <p className="text-sm text-muted-foreground">
          <Link
            to={PUBLIC_ROUTES.LOGIN}
            className="underline underline-offset-4"
          >
            Back to password login
          </Link>
        </p>
      }
    >
      <SchemaForm
        schema={emailLoginSchema}
        defaultValues={{ deviceId: getOrCreateDeviceId() }}
        fieldConfig={{
          deviceId: { hidden: true },
        }}
        submitLabel={isPending ? "Sending…" : "Send code"}
        onSubmit={async (values) => {
          setAck(null);
          await submit(
            {
              ...values,
              deviceId: values.deviceId || getOrCreateDeviceId(),
            },
            undefined,
            {
              onSuccess: (res) => {
                if (isAuthChallenge(res)) {
                  navigate(PUBLIC_ROUTES.VERIFY_OTP, {
                    replace: true,
                    state: saveOtpChallenge(res as IAuthChallengeResponse),
                  });
                  return;
                }
                setAck(
                  (res as { message?: string }).message ??
                    "If an account exists, an OTP was sent.",
                );
              },
            },
          );
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
