import { z } from "zod";
import { field } from "../../lib/field-meta.js";
import { genderSchema, userLevelSchema } from "../user/schema.js";

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
  /** Flattened effective permissions, e.g. `orders:read` or `*:*`. */
  permissions: z.array(z.string()),
});

/** POST /auth/login — JWT is set as an HttpOnly cookie, not returned in JSON. */
export const loginResponseSchema = z.object({
  user: authUserSchema,
  message: z.string(),
});

/** GET /auth/csrf — cookie↔header synchronizer token. */
export const csrfTokenResponseSchema = z.object({
  csrfToken: z.string().min(1),
});
