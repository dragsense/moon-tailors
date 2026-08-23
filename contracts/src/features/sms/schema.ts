import { z } from "zod";
import {
  createPaginatedSchema,
  listQuerySchema,
} from "../../common/schema.js";
import { field } from "../../lib/field-meta.js";
import { ESmsDirection, ESmsStatus } from "./enum.js";

export const smsMessageSchema = z.object({
  id: z.string().uuid(),
  senderId: z.string().uuid().nullable().optional(),
  fromPhone: z.string(),
  toPhone: z.string(),
  contactPhone: z.string(),
  body: z.string(),
  direction: z.nativeEnum(ESmsDirection),
  status: z.nativeEnum(ESmsStatus),
  twilioMessageSid: z.string().nullable().optional(),
  error: z.string().nullable().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const smsThreadSchema = z.object({
  contactPhone: z.string(),
  lastBody: z.string(),
  lastDirection: z.nativeEnum(ESmsDirection),
  lastAt: z.string().datetime(),
  messageCount: z.number().int().nonnegative(),
});

export const sendSmsSchema = z.object({
  to: z
    .string()
    .min(7)
    .max(30)
    .regex(/^\+?[0-9\s()-]+$/, "Invalid phone number"),
  body: z.string().min(1).max(1600),
});

export const smsMessageListQuerySchema = listQuerySchema.extend({
  contactPhone: field(z.string().min(3).max(30).optional(), {
    type: "text",
    filter: "eq",
  }),
  direction: field(z.nativeEnum(ESmsDirection).optional(), {
    type: "select",
    filter: "eq",
  }),
});

export const paginatedSmsMessagesSchema =
  createPaginatedSchema(smsMessageSchema);

export const smsStatusSchema = z.object({
  configured: z.boolean(),
  fromNumber: z.string().nullable(),
});
