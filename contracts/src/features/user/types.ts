import type { z } from "zod";
import {
  createUserSchema,
  updateUserSchema,
  userListQuerySchema,
} from "./schema.js";

/** Request payload / query aliases. */
export type TCreateUserData = z.infer<typeof createUserSchema>;
export type TUpdateUserData = z.infer<typeof updateUserSchema>;
export type TUserListQuery = z.infer<typeof userListQuerySchema>;
