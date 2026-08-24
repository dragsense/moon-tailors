import { OpsProvider } from "~/ops";
import { customersListOps } from "~/features/customers/ops";
import type { Route } from "./+types/list";

export function meta(_args: Route.MetaArgs) {
  return [{ title: "Customers · Moon Tailors" }];
}

export default function CustomersPage() {
  return (
    <OpsProvider store={customersListOps}>
      {({ components }) => components.listCustomers}
    </OpsProvider>
  );
}
