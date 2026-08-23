import { createOps } from "~/ops";
import { fileUploadOpsCore } from "./core";

/** /files — full file manager pack. */
export const filesListOps = createOps({
  id: "files-list",
  scope: "page",
  ops: {
    ...fileUploadOpsCore,
  },
});

export { fileUploadOpsCore };
