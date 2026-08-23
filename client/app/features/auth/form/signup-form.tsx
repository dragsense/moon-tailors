import { Link, useNavigate } from "react-router";
import type { IAuthChallengeResponse } from "@template/contracts";
import { signupSchema } from "@template/contracts";
import { SchemaForm } from "~/components/form-ui";
import { SurfaceCard } from "~/components/layout-ui";
import { PUBLIC_ROUTES } from "~/config";
import type { MutationOpComponentProps } from "~/ops";
import { saveOtpChallenge } from "~/features/auth/session";

/** signupPageOps.signup component. */
export function SignupForm({
  submit,
  isPending,
  isError,
  error,
}: MutationOpComponentProps) {
  const navigate = useNavigate();

  return (
    <SurfaceCard
      className="mx-auto max-w-md"
      title="Sign up"
      description="Create an account. You will verify with an OTP next."
      contentClassName="space-y-4"
      footer={
        <p className="text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link
            to={PUBLIC_ROUTES.LOGIN}
            className="underline underline-offset-4"
          >
            Login
          </Link>
        </p>
      }
    >
      <SchemaForm
        schema={signupSchema}
        submitLabel={isPending ? "Creating…" : "Create account"}
        onSubmit={async (values) => {
          await submit(values, undefined, {
            onSuccess: (res) => {
              navigate(PUBLIC_ROUTES.VERIFY_OTP, {
                replace: true,
                state: saveOtpChallenge(res as IAuthChallengeResponse),
              });
            },
          });
        }}
      />
      {isError ? (
        <p className="text-sm text-destructive">
          {error instanceof Error ? error.message : "Signup failed"}
        </p>
      ) : null}
    </SurfaceCard>
  );
}
