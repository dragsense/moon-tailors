import { createOps, pickOps } from "~/ops";
import { authOpsCore } from "./core";

/** /forgot-password. */
export const forgotPasswordPageOps = createOps({
  id: "auth-forgot-password",
  scope: "page",
  ops: pickOps(authOpsCore, { forgotPassword: true }),
});
