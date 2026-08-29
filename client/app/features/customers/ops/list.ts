import {
  composeSuccess,
  createOps,
  invalidateQueriesKey,
  pickOps,
  type OpsBag,
} from "~/ops";
import { measurementOpsCore } from "~/features/measurements/ops";
import { orderOpsCore } from "~/features/orders/ops/core";
import { orderKeys } from "~/features/orders/query-keys";
import { customerOpsCore } from "./core";
import { customerKeys } from "../query-keys";

const refreshHostCustomer = (_r: unknown, _v: unknown, _ops: OpsBag) => {
  invalidateQueriesKey(customerKeys.detail());
  invalidateQueriesKey(orderKeys.list());
  invalidateQueriesKey(orderKeys.detail());
};

export const customersListOps = createOps({
  id: "customers-list",
  scope: "page",
  ops: pickOps(customerOpsCore, ["listCustomers", "createCustomer"]),
});

export const customerDetailOps = createOps({
  id: "customer-detail",
  scope: "page",
  ops: {
    ...pickOps(customerOpsCore, ["getCustomer", "updateCustomer"]),
    ...pickOps(measurementOpsCore, {
      updateMeasurement: {
        onSuccess: composeSuccess(
          measurementOpsCore.updateMeasurement.onSuccess,
          refreshHostCustomer,
        ),
      },
      addMeasurement: {
        onSuccess: composeSuccess(
          measurementOpsCore.addMeasurement.onSuccess,
          refreshHostCustomer,
        ),
      },
      applyMeasurementsToDefault: {
        onSuccess: composeSuccess(
          measurementOpsCore.applyMeasurementsToDefault.onSuccess,
          refreshHostCustomer,
        ),
      },
    }),
    ...pickOps(orderOpsCore, {
      listOrders: {
        initialParams: { page: 1, limit: 20 },
      },
      viewOrder: true,
      createOrder: {
        onSuccess: composeSuccess(
          orderOpsCore.createOrder.onSuccess,
          refreshHostCustomer,
        ),
      },
      updateOrder: {
        onSuccess: composeSuccess(
          orderOpsCore.updateOrder.onSuccess,
          refreshHostCustomer,
        ),
      },
    }),
  },
});
