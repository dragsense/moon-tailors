import { createOps, pickOps } from "~/ops";
import { vendorOpsCore } from "./core";

export const vendorsListOps = createOps({
  id: "vendors-list",
  scope: "page",
  ops: pickOps(vendorOpsCore, ["listVendors", "createVendor"]),
});

export const vendorDetailOps = createOps({
  id: "vendor-detail",
  scope: "page",
  ops: pickOps(vendorOpsCore, [
    "getVendor",
    "updateVendor",
    "addVendorPurchase",
    "addVendorPayment",
  ]),
});
