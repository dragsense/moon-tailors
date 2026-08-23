import { PaymentsPage } from "~/features/payments";
import type { Route } from "./+types/payments";

export function meta(_args: Route.MetaArgs) {
  return [{ title: "Payments · Template" }];
}

export default function PaymentsRoute() {
  return <PaymentsPage />;
}
