import { createOps } from "~/ops";
import { profileOpsCore } from "./core";

/** Page-scoped profile pack — mount with OpsProvider on the profile route. */
export const profileOps = createOps({
  id: "profile",
  scope: "page",
  ops: {
    myProfile: profileOpsCore.myProfile,
    updateMe: profileOpsCore.updateMe,
  },
});

export const resetPasswordOps = createOps({
  id: "reset-password",
  scope: "page",
  ops: {
    changePassword: profileOpsCore.changePassword,
  },
});
