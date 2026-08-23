import { z } from "zod";
import {
  createPaginatedSchema,
  listQuerySchema,
} from "../../common/schema.js";
import { field } from "../../lib/field-meta.js";
import { EEmailDirection, EEmailStatus } from "./enum.js";

export const emailMessageSchema = z.object({
  id: z.string().uuid(),
  senderId: z.string().uuid().nullable().optional(),
  fromEmail: z.string(),
  fromName: z.string().nullable().optional(),
  toEmail: z.string(),
  contactEmail: z.string(),
  subject: z.string(),
  html: z.string(),
  text: z.string().nullable().optional(),
  direction: z.nativeEnum(EEmailDirection),
  status: z.nativeEnum(EEmailStatus),
  messageId: z.string().nullable().optional(),
  imapUid: z.string().nullable().optional(),
  isRead: z.boolean(),
  error: z.string().nullable().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const emailThreadSchema = z.object({
  contactEmail: z.string(),
  lastSubject: z.string(),
  lastPreview: z.string(),
  lastDirection: z.nativeEnum(EEmailDirection),
  lastAt: z.string().datetime(),
  messageCount: z.number().int().nonnegative(),
  unreadCount: z.number().int().nonnegative(),
});

export const sendEmailSchema = z.object({
  to: z.string().email(),
  subject: z.string().min(1).max(500),
  body: z.string().min(1).max(100_000),
  /** When true, `body` is treated as HTML; otherwise plain text wrapped as HTML. */
  html: z.boolean().optional(),
});

export const emailMessageListQuerySchema = listQuerySchema.extend({
  contactEmail: field(z.string().email().optional(), {
    type: "text",
    filter: "eq",
  }),
  direction: field(z.nativeEnum(EEmailDirection).optional(), {
    type: "select",
    filter: "eq",
  }),
});

export const paginatedEmailMessagesSchema =
  createPaginatedSchema(emailMessageSchema);

export const emailStatusSchema = z.object({
  sendConfigured: z.boolean(),
  receiveConfigured: z.boolean(),
  fromEmail: z.string().nullable(),
});

export const emailSyncResultSchema = z.object({
  imported: z.number().int().nonnegative(),
});

export const markEmailReadSchema = z.object({
  isRead: z.boolean().default(true),
});
