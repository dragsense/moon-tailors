import type { z } from "zod";
import {
  createNotificationSchema,
  createPushSubscriptionSchema,
  notificationListQuerySchema,
  registerFcmDeviceSchema,
} from "./schema.js";

export type TCreateNotificationData = z.infer<typeof createNotificationSchema>;
export type TCreatePushSubscriptionData = z.infer<
  typeof createPushSubscriptionSchema
>;
export type TRegisterFcmDeviceData = z.infer<typeof registerFcmDeviceSchema>;
export type TNotificationListQuery = z.infer<typeof notificationListQuerySchema>;
