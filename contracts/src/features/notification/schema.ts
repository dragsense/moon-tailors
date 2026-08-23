import { z } from "zod";
import {
  createPaginatedSchema,
  listQuerySchema,
} from "../../common/schema.js";
import { field } from "../../lib/field-meta.js";
import {
  EFcmPlatform,
  ENotificationPriority,
  ENotificationType,
} from "./enum.js";

export const notificationSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  message: z.string(),
  type: z.nativeEnum(ENotificationType),
  priority: z.nativeEnum(ENotificationPriority),
  recipientId: z.string().uuid(),
  entityType: z.string().nullable().optional(),
  metadata: z.record(z.string(), z.unknown()).nullable().optional(),
  isRead: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const createNotificationSchema = z.object({
  title: field(z.string().min(1).max(255), {
    type: "text",
    label: "Title",
    required: true,
    order: 1,
  }),
  message: field(z.string().min(1).max(4000), {
    type: "textarea",
    label: "Message",
    required: true,
    order: 2,
  }),
  type: z.nativeEnum(ENotificationType).default(ENotificationType.INFO),
  priority: z.nativeEnum(ENotificationPriority).default(ENotificationPriority.NORMAL),
  recipientId: z.string().uuid(),
  entityType: z.string().max(100).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const pushSubscriptionKeysSchema = z.object({
  p256dh: z.string().min(1),
  auth: z.string().min(1),
});

export const createPushSubscriptionSchema = z.object({
  endpoint: z.string().url(),
  keys: pushSubscriptionKeysSchema,
  deviceId: z.string().max(255).optional(),
});

/** POST /notifications/push/device — register mobile FCM token. */
export const registerFcmDeviceSchema = z.object({
  token: z.string().min(20),
  platform: z.nativeEnum(EFcmPlatform),
  deviceId: z.string().max(255).optional(),
});

export const fcmDeviceSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  token: z.string(),
  platform: z.nativeEnum(EFcmPlatform),
  deviceId: z.string().nullable().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const notificationListQuerySchema = listQuerySchema.extend({
  unreadOnly: z.coerce.boolean().optional(),
});

export const paginatedNotificationsSchema =
  createPaginatedSchema(notificationSchema);

/** Nested under entity settings — notifications.* keys. */
export const notificationPreferencesSchema = z.object({
  inAppEnabled: z.boolean().default(true),
  pushEnabled: z.boolean().default(false),
  emailEnabled: z.boolean().default(true),
  bellEnabled: z.boolean().default(true),
});
