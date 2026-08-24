import { OpsProvider } from "~/ops";
import { ordersListOps } from "~/features/orders/ops";
import type { Route } from "./+types/list";

export function meta(_args: Route.MetaArgs) {
  return [{ title: "Orders · Moon Tailors" }];
}

export default function OrdersPage() {
  return (
    <OpsProvider store={ordersListOps}>
      {({ components }) => components.listOrders}
    </OpsProvider>
  );
}
