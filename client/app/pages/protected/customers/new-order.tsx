import { OpsProvider } from "~/ops";
import { createOrderOps } from "~/features/orders/ops";
import type { Route } from "./+types/new-order";

export function meta(_args: Route.MetaArgs) {
  return [{ title: "New order · Moon Tailors" }];
}

export default function NewOrderPage() {
  return (
    <OpsProvider store={createOrderOps}>
      {({ components }) => components.createOrderPage}
    </OpsProvider>
  );
}
