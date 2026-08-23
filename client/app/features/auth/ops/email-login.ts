import { createOps, pickOps } from "~/ops";
import { authOpsCore } from "./core";

/** /email-login — passwordless OTP. */
export const emailLoginPageOps = createOps({
  id: "auth-email-login",
  scope: "page",
  ops: pickOps(authOpsCore, { emailLogin: true }),
});
