import { createOps, pickOps } from "~/ops";
import { customerOpsCore } from "~/features/customers/ops/core";
import { dashboardOpsCore } from "./core";

export const dashboardPageOps = createOps({
  id: "dashboard-page",
  scope: "page",
  ops: {
    ...dashboardOpsCore,
    ...pickOps(customerOpsCore, ["listCustomers", "createCustomer"]),
  },
});

export { dashboardOpsCore };
