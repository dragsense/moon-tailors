import { z } from "zod";
import {
  createPaginatedSchema,
  listQuerySchema,
} from "../../common/schema.js";
import { field } from "../../lib/field-meta.js";
import { EChatMessageType } from "./enum.js";

/** Nested user from `participants.user` / `message.sender` relations. */
export const chatUserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  /** Hydrated on UserEntity (@AfterLoad). */
  name: z.string().optional(),
});

/** Chat participant row — entity relation shape. */
export const chatParticipantSchema = z.object({
  userId: z.string().uuid(),
  unreadCount: z.number().int().optional(),
  user: chatUserSchema.optional(),
});

/** POST /chat — start or reopen a direct chat. */
export const createChatSchema = z.object({
  participantId: field(z.string().uuid(), {
    type: "select",
    label: "User",
    required: true,
    order: 1,
  }),
});

/** POST /chat/:id/messages body. */
export const sendChatMessageSchema = z.object({
  message: field(z.string().min(1, "Message is required").max(4000), {
    type: "textarea",
    label: "Message",
    required: true,
    order: 1,
  }),
});

export const chatMessageSchema = z.object({
  id: z.string().uuid(),
  chatId: z.string().uuid(),
  senderId: z.string().uuid(),
  message: z.string(),
  messageType: z.nativeEnum(EChatMessageType).default(EChatMessageType.TEXT),
  sender: chatUserSchema.optional(),
  createdAt: z.union([z.string().datetime(), z.coerce.date()]),
});

export const chatSchema = z.object({
  id: z.string().uuid(),
  name: z.string().nullable().optional(),
  isGroup: z.boolean().default(false),
  participantIds: z.array(z.string().uuid()).optional(),
  participants: z.array(chatParticipantSchema).optional(),
  lastMessage: chatMessageSchema.nullish(),
  unreadCount: z.number().int().min(0).default(0),
  createdAt: z.union([z.string().datetime(), z.coerce.date()]),
  updatedAt: z.union([z.string().datetime(), z.coerce.date()]),
});

/** GET /chat — nested filters via `filterColumn` (joins auto-applied). */
export const chatListQuerySchema = listQuerySchema.extend({
  participantEmail: field(
    z.preprocess(
      (v) => (v === "" || v == null ? undefined : v),
      z.string().email().optional(),
    ),
    {
      type: "email",
      label: "Participant email",
      order: 2,
      filter: "eqi",
      filterColumn: "participants.user.email",
    },
  ),
  participantFirstName: field(
    z.preprocess(
      (v) => (v === "" || v == null ? undefined : v),
      z.string().min(1).optional(),
    ),
    {
      type: "text",
      label: "Participant first name",
      order: 3,
      filter: "eqi",
      filterColumn: "participants.user.firstName",
    },
  ),
});

/**
 * GET /chat/:id/messages — `chatId` comes from the path (ACL), not the query.
 * Nested sender filters use `filterColumn`.
 */
export const chatMessageListQuerySchema = listQuerySchema.extend({
  chatId: z.string().uuid().optional(),
  senderId: field(
    z.preprocess(
      (v) => (v === "" || v === "__any__" || v == null ? undefined : v),
      z.string().uuid().optional(),
    ),
    {
      type: "select",
      label: "Sender",
      order: 2,
      filter: "eq",
      filterColumn: "senderId",
    },
  ),
  senderEmail: field(
    z.preprocess(
      (v) => (v === "" || v == null ? undefined : v),
      z.string().email().optional(),
    ),
    {
      type: "email",
      label: "Sender email",
      order: 3,
      filter: "eqi",
      filterColumn: "sender.email",
    },
  ),
  senderFirstName: field(
    z.preprocess(
      (v) => (v === "" || v == null ? undefined : v),
      z.string().min(1).optional(),
    ),
    {
      type: "text",
      label: "Sender first name",
      order: 4,
      filter: "eqi",
      filterColumn: "sender.firstName",
    },
  ),
});

export const paginatedChatsSchema = createPaginatedSchema(chatSchema);
export const paginatedChatMessagesSchema =
  createPaginatedSchema(chatMessageSchema);
