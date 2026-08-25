import type { z } from "zod";
import {
  authUserSchema,
  csrfTokenResponseSchema,
  loginResponseSchema,
} from "./schema.js";

/** Response / entity interfaces. */
export interface IAuthUser extends z.infer<typeof authUserSchema> {}

export interface ILoginResponse extends z.infer<typeof loginResponseSchema> {}

export interface ICsrfTokenResponse
  extends z.infer<typeof csrfTokenResponseSchema> {}
