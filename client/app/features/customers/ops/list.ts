import {
  composeSuccess,
  createOps,
  invalidateQueriesKey,
  pickOps,
  refetchOp,
  type OpsBag,
} from "~/ops";
import { measurementOpsCore } from "~/features/measurements/ops";
import { orderOpsCore } from "~/features/orders/ops/core";
import { customerOpsCore, refreshCustomers } from "./core";
import { customerKeys } from "../query-keys";

const refreshHostCustomer = (_r: unknown, _v: unknown, ops: OpsBag) => {
  refetchOp(ops, "getCustomer");
  refetchOp(ops, "listOrders");
  invalidateQueriesKey(customerKeys.detail());
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
      getMeasurement: true,
      updateDefaultMeasurements: {
        onSuccess: composeSuccess(
          measurementOpsCore.updateDefaultMeasurements.onSuccess,
          refreshCustomers,
        ),
      },
      updateMeasurement: {
        onSuccess: composeSuccess(
          measurementOpsCore.updateMeasurement.onSuccess,
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
        component: undefined,
      },
      getOrder: { component: undefined },
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
