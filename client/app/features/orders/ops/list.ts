import { composeSuccess, createOps, pickOps } from "~/ops";
import {
  measurementOpsCore,
  refreshMeasurements,
} from "~/features/measurements/ops";
import { orderOpsCore, refreshOrders } from "./core";

export const ordersListOps = createOps({
  id: "orders-list",
  scope: "page",
  ops: {
    ...pickOps(orderOpsCore, [
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
