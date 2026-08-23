import { createOps, pickOps } from "~/ops";
import { authOpsCore } from "./core";

/** /verify-otp — OTP verification form. */
export const verifyOtpPageOps = createOps({
  id: "auth-verify-otp",
  scope: "page",
  ops: pickOps(authOpsCore, { verifyOtp: true }),
});
