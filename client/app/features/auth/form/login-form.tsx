import { Link, useNavigate } from "react-router";
import type { IAuthChallengeResponse, ILoginResponse } from "@template/contracts";
import { loginSchema } from "@template/contracts";
import { SchemaForm } from "~/components/form-ui";
import { SurfaceCard } from "~/components/layout-ui";
import { LEVEL_HOME, PUBLIC_ROUTES } from "~/config";
import type { MutationOpComponentProps } from "~/ops";
import { isAuthChallenge, isLoginResponse } from "~/features/auth/api";
import { useAuthOptions } from "~/features/auth/hooks";
import { getOrCreateDeviceId } from "~/features/auth/lib/device-id";
import { saveOtpChallenge, writeSession } from "~/features/auth/session";

/** loginPageOps.login component. */
export function LoginForm({
  submit,
  isPending,
  isError,
  error,
}: MutationOpComponentProps) {
  const navigate = useNavigate();
  const { data: options } = useAuthOptions();
  const passwordOtp = options?.loginPasswordOtp ?? true;
  const emailOtp = options?.loginEmailOtp ?? true;
  const deviceId = getOrCreateDeviceId();

  return (
    <SurfaceCard
      className="mx-auto max-w-md"
      title="Login"
      description={
        passwordOtp
          ? "Sign in with email and password. You will receive an OTP next (skipped on remembered devices)."
          : "Sign in with email and password."
      }
      contentClassName="space-y-4"
      footer={
        <div className="space-y-2 text-sm text-muted-foreground">
          <p>
            <Link
              to={PUBLIC_ROUTES.FORGOT_PASSWORD}
              className="underline underline-offset-4"
            >
              Forgot password?
            </Link>
          </p>
          {emailOtp ? (
            <p>
              Prefer a code instead?{" "}
              <Link
                to={PUBLIC_ROUTES.EMAIL_LOGIN}
                className="underline underline-offset-4"
              >
                Login with email OTP
              </Link>
            </p>
          ) : null}
          <p>
            No account?{" "}
            <Link
              to={PUBLIC_ROUTES.SIGNUP}
              className="underline underline-offset-4"
            >
              Sign up
            </Link>
          </p>
        </div>
      }
    >
      <SchemaForm
        schema={loginSchema}
        defaultValues={{ deviceId }}
        fieldConfig={{
          deviceId: { hidden: true },
        }}
        submitLabel={isPending ? "Signing in…" : "Sign in"}
        onSubmit={async (values) => {
          await submit(
            { ...values, deviceId: values.deviceId || deviceId },
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
                if (isLoginResponse(res)) {
                  writeSession(res as ILoginResponse);
                  navigate(LEVEL_HOME[res.user.level], { replace: true });
                }
              },
            },
          );
        }}
      />
      {isError ? (
        <p className="text-sm text-destructive">
          {error instanceof Error ? error.message : "Login failed"}
        </p>
      ) : null}
    </SurfaceCard>
  );
}
