import { z } from "zod";
import { field } from "../../lib/field-meta.js";
import { genderSchema, userLevelSchema } from "../user/schema.js";
import { EOtpPurpose, EPasswordResetMode } from "./enum.js";

export const otpPurposeSchema = z.nativeEnum(EOtpPurpose);
export const passwordResetModeSchema = z.nativeEnum(EPasswordResetMode);

const emailField = field(z.string().email("Invalid email"), {
  type: "email",
  label: "Email",
  placeholder: "you@example.com",
  required: true,
  order: 1,
});

const passwordField = (order: number, label = "Password") =>
  field(z.string().min(8, "Min 8 characters"), {
    type: "password",
    label,
    required: true,
    order,
  });

/** POST /auth/login body. */
export const loginSchema = z.object({
  email: emailField,
  password: passwordField(2),
  /** Client-generated device id — skips OTP when previously trusted. */
  deviceId: field(z.string().min(1).max(200).optional(), {
    type: "hidden",
    order: 3,
  }),
});

/** POST /auth/signup body. */
export const signupSchema = z.object({
  firstName: field(z.string().min(1, "Required"), {
    type: "text",
    label: "First name",
    required: true,
    order: 1,
  }),
  lastName: field(z.string().min(1, "Required"), {
    type: "text",
    label: "Last name",
    required: true,
    order: 2,
  }),
  email: field(z.string().email("Invalid email"), {
    type: "email",
    label: "Email",
    required: true,
    order: 3,
  }),
  password: passwordField(4),
});

/** POST /auth/email-login — passwordless OTP. */
export const emailLoginSchema = z.object({
  email: emailField,
  deviceId: field(z.string().min(1).max(200).optional(), {
    type: "hidden",
    order: 2,
  }),
});

/** POST /auth/forgot-password. */
export const forgotPasswordSchema = z.object({
  email: emailField,
});

/** POST /auth/reset-password (OTP mode). */
export const resetPasswordWithOtpSchema = z.object({
  challengeId: field(z.string().uuid("Invalid challenge"), {
    type: "text",
    label: "Challenge",
    required: true,
    order: 1,
  }),
  code: field(z.string().min(4).max(10), {
    type: "text",
    label: "OTP code",
    placeholder: "123456",
    required: true,
    order: 2,
  }),
  password: passwordField(3, "New password"),
});

/** POST /auth/reset-password (link mode). */
export const resetPasswordWithTokenSchema = z.object({
  token: field(z.string().min(1, "Reset token required"), {
    type: "text",
    label: "Token",
    required: true,
    order: 1,
  }),
  password: passwordField(2, "New password"),
});

/** POST /auth/verify-otp body. */
export const verifyOtpSchema = z.object({
  challengeId: field(z.string().uuid("Invalid challenge"), {
    type: "text",
    label: "Challenge",
    required: true,
    order: 1,
  }),
  code: field(z.string().min(4).max(10), {
    type: "text",
    label: "OTP code",
    placeholder: "123456",
    required: true,
    order: 2,
  }),
  deviceId: field(z.string().min(1).max(200).optional(), {
    type: "hidden",
    order: 3,
  }),
  rememberDevice: field(z.boolean().optional().default(false), {
    type: "switch",
    label: "Remember this device",
    order: 4,
  }),
});

/** GET /auth/options — public UI flags from server env. */
export const authOptionsSchema = z.object({
  loginPasswordOtp: z.boolean(),
  loginEmailOtp: z.boolean(),
  passwordResetMode: passwordResetModeSchema,
});

/** Auth user embedded in authenticated responses. */
export const authUserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  firstName: z.string(),
  lastName: z.string(),
  age: z.number().int().nullable().optional(),
  gender: genderSchema.nullable().optional(),
  level: userLevelSchema,
  /** Flattened effective permissions, e.g. `tasks:read` or `*:*`. */
  permissions: z.array(z.string()),
});

/**
 * POST /auth/login|signup|email-login|forgot-password (otp mode) — OTP challenge.
 * Code is delivered by email only (Mailpit in local).
 */
export const authChallengeResponseSchema = z.object({
  challengeId: z.string().uuid(),
  purpose: otpPurposeSchema,
  expiresAt: z.string().datetime(),
  message: z.string(),
});

/** Generic ack (forgot-password always; reset-password success). */
export const authMessageResponseSchema = z.object({
  message: z.string(),
});

/** POST /auth/login — JWT is set as an HttpOnly cookie, not returned in JSON. */
export const loginResponseSchema = z.object({
  user: authUserSchema,
  message: z.string(),
});

/** Optional encrypted API envelope (when ENCRYPTION_ENABLED). */
export const encryptedResponseSchema = z.object({
  encrypted: z.literal(true),
  data: z.string(),
  algorithm: z.string(),
  timestamp: z.number(),
});

/** GET /auth/csrf — cookie↔header synchronizer token. */
export const csrfTokenResponseSchema = z.object({
  csrfToken: z.string().min(1),
});
