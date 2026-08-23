/**
 * Auth feature ops.
 *
 * ```txt
 * ops/
 *   core.ts              authOpsCore
 *   login.ts             /login
 *   signup.ts            /signup
 *   verify-otp.ts        /verify-otp
 *   email-login.ts       /email-login
 *   forgot-password.ts   /forgot-password
 *   reset-password.ts    /reset-password
 * ```
 */
export { authOpsCore, type AuthOpsCore, type AuthOpName } from "./core";
export { loginPageOps } from "./login";
export { signupPageOps } from "./signup";
export { verifyOtpPageOps } from "./verify-otp";
export { emailLoginPageOps } from "./email-login";
export { forgotPasswordPageOps } from "./forgot-password";
export { resetPasswordPageOps } from "./reset-password";
