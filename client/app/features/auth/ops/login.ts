import { createOps, pickOps } from "~/ops";
import { authOpsCore } from "./core";

/** `/` (login) — sign-in form. */
export const loginPageOps = createOps({
  id: "auth-login",
  scope: "page",
  ops: pickOps(authOpsCore, { login: {
    auto: true,
  } }),
});
