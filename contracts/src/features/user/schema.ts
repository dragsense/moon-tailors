import { z } from "zod";
import {
  createPaginatedSchema,
  listQuerySchema,
} from "../../common/schema.js";
import { field } from "../../lib/field-meta.js";
import { EUserLevel } from "./enum.js";

export const userLevelSchema = z.nativeEnum(EUserLevel);

/** POST /users body — CreateUserDto. */
export const createUserSchema = z.object({
  name: field(z.string().min(1, "Name is required").max(80), {
    type: "text",
    label: "Name",
    placeholder: "Ada Lovelace",
    required: true,
    order: 1,
  }),
  email: field(z.string().email("Invalid email"), {
    type: "email",
    label: "Email",
    placeholder: "ada@example.com",
    required: true,
    order: 2,
  }),
});

/** PATCH /users/:id body — UpdateUserDto. */
export const updateUserSchema = createUserSchema.partial();

/** GET /users/:id (and list item) — UserDto. */
export const userSchema = createUserSchema.extend({
  id: z.string().uuid(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

/**
 * POST /users response user — includes one-time plaintext password when
 * the server auto-generated credentials (admin create flow).
 */
export const createdUserSchema = userSchema.extend({
  password: z.string().min(1).optional(),
});

/** POST /users response — CreateUserResponseDto. */
export const createUserResponseSchema = z.object({
  message: z.string(),
  user: createdUserSchema,
});

/** GET /users query — UserListDto. */
export const userListQuerySchema = listQuerySchema.extend({
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

/** GET /users response — UserPaginatedDto. */
export const paginatedUsersSchema = createPaginatedSchema(userSchema);
