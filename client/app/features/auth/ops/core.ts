/**
 * Auth ops catalog — guest login/signup/verify/reset flows.
 * Not a store. Page packs pick from here via pickOps.
 */
import type {
  TEmailLoginData,
  TForgotPasswordData,
  TLoginData,
  TResetPasswordWithOtpData,
  TResetPasswordWithTokenData,
  TSignupData,
  TVerifyOtpData,
} from "@template/contracts";
import type { OpConfig } from "~/ops";
import {
  emailLogin,
  forgotPassword,
  login,
  resetPasswordWithOtp,
  resetPasswordWithToken,
  signup,
  verifyOtp,
} from "../api";
import { EmailLoginForm } from "../form/email-login-form";
import { ForgotPasswordForm } from "../form/forgot-password-form";
import { LoginForm } from "../form/login-form";
import { ResetPasswordForm } from "../form/reset-password-form";
import { SignupForm } from "../form/signup-form";
import { VerifyOtpForm } from "../form/verify-otp-form";

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
  emailLogin: {
    kind: "mutation" as const,
    mutate: (vars: unknown) => emailLogin(vars as TEmailLoginData),
    component: EmailLoginForm,
    auto: false,
    onError: (error: Error) => {
      console.error("[auth.emailLogin]", error.message);
    },
  },
  forgotPassword: {
    kind: "mutation" as const,
    mutate: (vars: unknown) => forgotPassword(vars as TForgotPasswordData),
    component: ForgotPasswordForm,
    auto: false,
    onError: (error: Error) => {
      console.error("[auth.forgotPassword]", error.message);
    },
  },
  resetPassword: {
    kind: "mutation" as const,
    mutate: (vars: unknown) => {
      const body = vars as
        | TResetPasswordWithOtpData
        | TResetPasswordWithTokenData;
      if ("token" in body && body.token) {
        return resetPasswordWithToken(body as TResetPasswordWithTokenData);
      }
      return resetPasswordWithOtp(body as TResetPasswordWithOtpData);
    },
    component: ResetPasswordForm,
    auto: false,
    onError: (error: Error) => {
      console.error("[auth.resetPassword]", error.message);
    },
  },
  signup: {
    kind: "mutation" as const,
    mutate: (vars: unknown) => signup(vars as TSignupData),
    component: SignupForm,
    auto: false,
    onError: (error: Error) => {
      console.error("[auth.signup]", error.message);
    },
  },
  verifyOtp: {
    kind: "mutation" as const,
    mutate: (vars: unknown) => verifyOtp(vars as TVerifyOtpData),
    component: VerifyOtpForm,
    auto: false,
    onError: (error: Error) => {
      console.error("[auth.verifyOtp]", error.message);
    },
  },
} satisfies Record<string, OpConfig>;

export type AuthOpsCore = typeof authOpsCore;
export type AuthOpName = keyof AuthOpsCore;
