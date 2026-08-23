import { createOps } from "~/ops";
import { dashboardOpsCore } from "./core";

export const dashboardPageOps = createOps({
  id: "dashboard-page",
  scope: "page",
  ops: {
    ...dashboardOpsCore,
  },
});

export { dashboardOpsCore };
