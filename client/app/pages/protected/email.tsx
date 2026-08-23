import { EmailInboxPage } from "~/features/email";
import type { Route } from "./+types/email";

export function meta(_args: Route.MetaArgs) {
  return [{ title: "Email · Template" }];
}

export default function EmailRoute() {
  return <EmailInboxPage />;
}
