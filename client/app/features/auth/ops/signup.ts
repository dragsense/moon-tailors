import { createOps, pickOps } from "~/ops";
import { authOpsCore } from "./core";

/** /signup — registration form. */
export const signupPageOps = createOps({
  id: "auth-signup",
  scope: "page",
  ops: pickOps(authOpsCore, { signup: true }),
});
