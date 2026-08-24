import type { z } from "zod";
import type { IMessageResponse } from "../../common/interface.js";
import {
  createdUserSchema,
  createUserResponseSchema,
  meUserSchema,
  paginatedUsersSchema,
  userSchema,
} from "./schema.js";

/** Response / entity interfaces. */
export interface IUser extends z.infer<typeof userSchema> {}

export interface IMeUser extends z.infer<typeof meUserSchema> {}

export interface ICreatedUser extends z.infer<typeof createdUserSchema> {}

export interface IPaginatedUsers
  extends z.infer<typeof paginatedUsersSchema> {}

export type TUserResponse = z.infer<typeof createUserResponseSchema>;

/** @deprecated Prefer TUserResponse — kept for call sites expecting IMessageResponse. */
export type TCreateUserResponse = TUserResponse & IMessageResponse;
