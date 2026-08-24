import type { z } from "zod";
import type { IMessageResponse } from "../../common/interface.js";
import {
  authChallengeResponseSchema,
  authOptionsSchema,
  authUserSchema,
  csrfTokenResponseSchema,
  loginResponseSchema,
} from "./schema.js";

/** Response / entity interfaces. */
export interface IAuthUser extends z.infer<typeof authUserSchema> {}

export interface IAuthChallengeResponse
  extends z.infer<typeof authChallengeResponseSchema> {}

export interface IAuthOptions extends z.infer<typeof authOptionsSchema> {}

export interface ILoginResponse extends z.infer<typeof loginResponseSchema> {}

export interface ISignupResponse extends IAuthChallengeResponse {}

export interface ICsrfTokenResponse
  extends z.infer<typeof csrfTokenResponseSchema> {}

export type TAuthMessageResponse = IMessageResponse;
