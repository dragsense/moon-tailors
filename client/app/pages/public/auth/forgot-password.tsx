import { OpsProvider } from "~/ops";
import { forgotPasswordPageOps } from "~/features/auth/ops/forgot-password";
import type { Route } from "./+types/forgot-password";

export function meta(_args: Route.MetaArgs) {
  return [{ title: "Forgot password · Template" }];
}

export default function ForgotPasswordPage() {
  return (
    <OpsProvider store={forgotPasswordPageOps}>
      {({ components }) => components.forgotPassword}
    </OpsProvider>
  );
}
