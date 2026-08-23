import type { z } from "zod";
import {
  authChallengeResponseSchema,
  authOptionsSchema,
  emailLoginSchema,
  encryptedResponseSchema,
  forgotPasswordSchema,
  loginSchema,
  refreshTokenResponseSchema,
  resetPasswordWithOtpSchema,
  resetPasswordWithTokenSchema,
  signupSchema,
  verifyOtpSchema,
} from "./schema.js";

/** Request payload aliases (forms / API body). */
export type TLoginData = z.infer<typeof loginSchema>;
export type TSignupData = z.infer<typeof signupSchema>;
export type TVerifyOtpData = z.infer<typeof verifyOtpSchema>;
export type TEmailLoginData = z.infer<typeof emailLoginSchema>;
export type TForgotPasswordData = z.infer<typeof forgotPasswordSchema>;
export type TResetPasswordWithOtpData = z.infer<
  typeof resetPasswordWithOtpSchema
>;
export type TResetPasswordWithTokenData = z.infer<
  typeof resetPasswordWithTokenSchema
>;
export type TAuthChallengeResponse = z.infer<typeof authChallengeResponseSchema>;
export type TAuthOptions = z.infer<typeof authOptionsSchema>;
export type TRefreshTokenResponse = z.infer<typeof refreshTokenResponseSchema>;
export type TEncryptedResponse = z.infer<typeof encryptedResponseSchema>;
