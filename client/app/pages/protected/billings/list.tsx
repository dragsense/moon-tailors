import { BillingListPage } from "~/features/billing";
import type { Route } from "./+types/list";

export function meta(_args: Route.MetaArgs) {
  return [{ title: "Billings · Template" }];
}

export default function BillingsRoute() {
  return <BillingListPage />;
}
