import { OpsProvider } from "~/ops";
import { signupPageOps } from "~/features/auth/ops/signup";
import type { Route } from "./+types/signup";

export function meta(_args: Route.MetaArgs) {
  return [{ title: "Sign up · Template" }];
}

export default function SignupPage() {
  return (
    <OpsProvider store={signupPageOps}>
      {({ components }) => components.signup}
    </OpsProvider>
  );
}
