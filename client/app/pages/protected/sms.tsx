import { SmsInboxPage } from "~/features/sms";
import type { Route } from "./+types/sms";

export function meta(_args: Route.MetaArgs) {
  return [{ title: "SMS · Template" }];
}

export default function SmsRoute() {
  return <SmsInboxPage />;
}
