import type {
  TChangePasswordData,
  TUpdateMeData,
} from "@moon-tailors/contracts";
import {
  createOps,
  pickOps,
  refetchOp,
  type OpConfig,
  type OpsBag,
} from "~/ops";
import { profileService } from "../api";
import { ChangePasswordForm } from "../form/change-password-form";
import { ProfileForm } from "../form/profile-form";
import { profileKeys } from "../query-keys";

export const profileOpsCore = {
  myProfile: {
    kind: "query" as const,
    fetch: () => profileService.getMe(),
    queryKey: () => profileKeys.me(),
    invalidateKey: profileKeys.me(),
    auto: true,
    queryOptions: {
      staleTime: 30_000,
    },
    onError: (error: Error) => {
      console.error("[profile.myProfile]", error.message);
    },
  },
  updateMe: {
    kind: "mutation" as const,
    mutate: (vars: unknown) => profileService.updateMe(vars as TUpdateMeData),
    component: ProfileForm,
    auto: true,
    onSuccess: (_result: unknown, _vars: unknown, ops: OpsBag) => {
      refetchOp(ops, "myProfile");
    },
    onError: (error: Error) => {
      console.error("[profile.updateMe]", error.message);
    },
  },
  changePassword: {
    kind: "mutation" as const,
    mutate: (vars: unknown) =>
      profileService.changePassword(vars as TChangePasswordData),
    component: ChangePasswordForm,
    auto: true,
    onError: (error: Error) => {
      console.error("[profile.changePassword]", error.message);
    },
  },
} satisfies Record<string, OpConfig>;

export type ProfileOpsCore = typeof profileOpsCore;

/** `/profile` */
export const profileOps = createOps({
  id: "profile",
  scope: "page",
  ops: pickOps(profileOpsCore, {
    myProfile: true,
    updateMe: true,
  }),
});

/** `/reset-password` */
export const resetPasswordOps = createOps({
  id: "reset-password",
  scope: "page",
  ops: pickOps(profileOpsCore, {
    changePassword: true,
  }),
});
