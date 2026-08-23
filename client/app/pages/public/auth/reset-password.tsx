import { OpsProvider } from "~/ops";
import { resetPasswordPageOps } from "~/features/auth/ops/reset-password";
import type { Route } from "./+types/reset-password";

export function meta(_args: Route.MetaArgs) {
  return [{ title: "Reset password · Template" }];
}

export default function ResetPasswordPage() {
  return (
    <OpsProvider store={resetPasswordPageOps}>
      {({ components }) => components.resetPassword}
    </OpsProvider>
  );
}
