import type { z } from "zod";
import {
  changePasswordSchema,
  createUserSchema,
  updateMeSchema,
  updateUserSchema,
  userListQuerySchema,
} from "./schema.js";

/** Request payload / query aliases. */
export type TCreateUserData = z.infer<typeof createUserSchema>;
export type TUpdateUserData = z.infer<typeof updateUserSchema>;
export type TUpdateMeData = z.infer<typeof updateMeSchema>;
export type TChangePasswordData = z.infer<typeof changePasswordSchema>;
export type TUserListQuery = z.infer<typeof userListQuerySchema>;
