/**
 * Auth ops catalog — guest login.
 * Not a store. Page packs pick from here via pickOps.
 */
import type { TLoginData } from "@moon-tailors/contracts";
import type { OpConfig } from "~/ops";
import { login } from "../api";
import { LoginForm } from "../form/login-form";

export const authOpsCore = {
  login: {
    kind: "mutation" as const,
    mutate: (vars: unknown) => login(vars as TLoginData),
    component: LoginForm,
    auto: false,
    onError: (error: Error) => {
      console.error("[auth.login]", error.message);
    },
  },
} satisfies Record<string, OpConfig>;

export type AuthOpsCore = typeof authOpsCore;
export type AuthOpName = keyof AuthOpsCore;
