import { createOps } from "~/ops";
import { orderOpsCore } from "./core";

export const ordersListOps = createOps({
  id: "orders-list",
  scope: "page",
  ops: {
    listOrders: orderOpsCore.listOrders,
  },
});

export const orderDetailOps = createOps({
  id: "order-detail",
  scope: "page",
  ops: {
    getOrder: orderOpsCore.getOrder,
    updateOrder: orderOpsCore.updateOrder,
    updateOrderMeasurements: orderOpsCore.updateOrderMeasurements,
    applyMeasurementsToDefault: orderOpsCore.applyMeasurementsToDefault,
  },
});

export const createOrderOps = createOps({
  id: "create-order",
  scope: "page",
  ops: {
    createOrderPage: orderOpsCore.createOrderPage,
    createOrder: orderOpsCore.createOrder,
  },
});
