import { OpsProvider } from "~/ops";
import { emailLoginPageOps } from "~/features/auth/ops/email-login";
import type { Route } from "./+types/email-login";

export function meta(_args: Route.MetaArgs) {
  return [{ title: "Email login · Template" }];
}

export default function EmailLoginPage() {
  return (
    <OpsProvider store={emailLoginPageOps}>
      {({ components }) => components.emailLogin}
    </OpsProvider>
  );
}
