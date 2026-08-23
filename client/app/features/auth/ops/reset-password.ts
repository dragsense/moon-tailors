import { createOps, pickOps } from "~/ops";
import { authOpsCore } from "./core";

/** /reset-password. */
export const resetPasswordPageOps = createOps({
  id: "auth-reset-password",
  scope: "page",
  ops: pickOps(authOpsCore, { resetPassword: true }),
});
