import { createOps } from "~/ops";
import { customerOpsCore } from "./core";

export const customersListOps = createOps({
  id: "customers-list",
  scope: "page",
  ops: {
    listCustomers: customerOpsCore.listCustomers,
    createCustomer: customerOpsCore.createCustomer,
  },
});

export const customerDetailOps = createOps({
  id: "customer-detail",
  scope: "page",
  ops: {
    getCustomer: customerOpsCore.getCustomer,
    listCustomerOrders: customerOpsCore.listCustomerOrders,
    updateCustomer: customerOpsCore.updateCustomer,
    updateDefaultMeasurements: customerOpsCore.updateDefaultMeasurements,
  },
});
