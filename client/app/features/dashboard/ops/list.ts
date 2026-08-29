import { composeSuccess, createOps, pickOps } from "~/ops";
import { customerOpsCore } from "~/features/customers/ops/core";
import {
  measurementOpsCore,
  refreshMeasurements,
} from "~/features/measurements/ops";
import { orderOpsCore, refreshOrders } from "~/features/orders/ops/core";
import { dashboardOpsCore } from "./core";

export const dashboardPageOps = createOps({
  id: "dashboard-page",
  scope: "page",
  ops: {
    ...dashboardOpsCore,
    ...pickOps(customerOpsCore, ["listCustomers", "createCustomer"]),
    ...pickOps(orderOpsCore, [
      "latestOrders",
      "listOrders",
      "viewOrder",
      "createOrder",
      "updateOrder",
    ]),
    ...pickOps(measurementOpsCore, {
      updateMeasurement: {
        onSuccess: composeSuccess(refreshMeasurements, refreshOrders),
      },
      applyMeasurementsToDefault: {
        onSuccess: composeSuccess(refreshMeasurements, refreshOrders),
      },
    }),
  },
});

export { dashboardOpsCore };
