import { OpsProvider } from "~/ops";
import { ResetPasswordPage } from "~/features/profile/reset-password-page";
import { resetPasswordOps } from "~/features/profile/ops";

export function meta() {
  return [{ title: "Reset password" }];
}

export default function ResetPasswordRoute() {
  return (
    <OpsProvider store={resetPasswordOps}>
      {() => <ResetPasswordPage />}
    </OpsProvider>
  );
}
