import { createOps } from "~/ops";
import { camerasOpsCore } from "./core";

export const camerasListOps = createOps({
  id: "cameras-list",
  scope: "page",
  ops: {
    ...camerasOpsCore,
  },
});

export { camerasOpsCore };
