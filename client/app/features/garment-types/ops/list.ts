import { createOps } from "~/ops";
import { garmentTypeOpsCore } from "./core";

export const garmentTypesListOps = createOps({
  id: "garment-types-list",
  scope: "page",
  ops: {
    ...garmentTypeOpsCore,
  },
});
