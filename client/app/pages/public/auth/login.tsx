import { OpsProvider } from "~/ops";
import { loginPageOps } from "~/features/auth/ops/login";
import type { Route } from "./+types/login";

export function meta(_args: Route.MetaArgs) {
  return [{ title: "Login · Template" }];
}

export default function LoginPage() {
  return (
    <OpsProvider store={loginPageOps}>
      {({ components }) => components.login}
    </OpsProvider>
  );
}
