import { OpsProvider } from "~/ops";
import { customerDetailOps } from "~/features/customers/ops";
import type { Route } from "./+types/detail";

export function meta(_args: Route.MetaArgs) {
  return [{ title: "Customer · Moon Tailors" }];
}

export default function CustomerDetailPage() {
  return (
    <OpsProvider store={customerDetailOps}>
      {({ components }) => components.getCustomer}
    </OpsProvider>
  );
}
