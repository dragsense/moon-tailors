import { createOps, pickOps } from "~/ops";
import { staffOpsCore } from "./core";

export const staffListOps = createOps({
  id: "staff-list",
  scope: "page",
  ops: pickOps(staffOpsCore, ["listStaff", "createStaff"]),
});

export const staffDetailOps = createOps({
  id: "staff-detail",
  scope: "page",
  ops: pickOps(staffOpsCore, [
    "getStaff",
    "updateStaff",
    "addStaffPayment",
    "editStaffPayment",
    "getStaffSlip",
  ]),
});
