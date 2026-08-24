import { z } from "zod";
import {
  createPaginatedSchema,
  listQuerySchema,
} from "../../common/schema.js";
import { field } from "../../lib/field-meta.js";
import { EGender, EUserLevel } from "./enum.js";

export const userLevelSchema = z.nativeEnum(EUserLevel);
export const genderSchema = z.nativeEnum(EGender);

const optionalAgeSchema = field(
  z.preprocess(
    (value) => (value === "" || value === undefined ? null : value),
    z.union([
      z.null(),
      z.coerce.number().int().min(1, "Enter a valid age").max(120),
    ]),
  ),
  {
    type: "number",
    label: "Age",
    placeholder: "e.g. 32",
    order: 4,
  },
);

const optionalGenderSchema = field(
  z.preprocess(
    (value) => (value === "" || value === undefined ? null : value),
    z.union([z.null(), genderSchema]),
  ),
  {
    type: "select",
    label: "Gender",
    order: 5,
    options: [
      { label: "Male", value: EGender.MALE },
      { label: "Female", value: EGender.FEMALE },
      { label: "Other", value: EGender.OTHER },
    ],
  },
);

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

/** GET/PATCH /users/me — logged-in profile (name, email, age, gender). */
export const updateMeSchema = z.object({
  firstName: field(z.string().trim().min(1, "First name is required").max(100), {
    type: "text",
    label: "First name",
    placeholder: "Ada",
    required: true,
    order: 1,
  }),
  lastName: field(z.string().trim().min(1, "Last name is required").max(100), {
    type: "text",
    label: "Last name",
    placeholder: "Lovelace",
    required: true,
    order: 2,
  }),
  email: field(z.string().trim().email("Invalid email").max(255), {
    type: "email",
    label: "Email",
    placeholder: "ada@example.com",
    required: true,
    order: 3,
  }),
  age: optionalAgeSchema,
  gender: optionalGenderSchema,
});

/** PATCH /users/me/password — logged-in user only. */
export const changePasswordSchema = z.object({
  currentPassword: field(z.string().min(1, "Current password is required"), {
    type: "password",
    label: "Current password",
    required: true,
    order: 1,
  }),
  newPassword: field(z.string().min(8, "Min 8 characters"), {
    type: "password",
    label: "New password",
    required: true,
    order: 2,
  }),
  confirmPassword: field(z.string().min(8, "Min 8 characters"), {
    type: "password",
    label: "Confirm new password",
    required: true,
    order: 3,
  }),
});

/** GET /users/me response. */
export const meUserSchema = z.object({
  id: z.string().uuid(),
  firstName: z.string(),
  lastName: z.string(),
  name: z.string(),
  email: z.string().email(),
  age: z.number().int().nullable(),
  gender: genderSchema.nullable(),
  level: userLevelSchema,
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
