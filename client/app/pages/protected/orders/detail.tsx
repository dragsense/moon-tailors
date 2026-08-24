import { OpsProvider } from "~/ops";
import { orderDetailOps } from "~/features/orders/ops";
import type { Route } from "./+types/detail";

export function meta(_args: Route.MetaArgs) {
  return [{ title: "Order · Moon Tailors" }];
}

export default function OrderDetailPage() {
  return (
    <OpsProvider store={orderDetailOps}>
      {({ components }) => components.getOrder}
    </OpsProvider>
  );
}
