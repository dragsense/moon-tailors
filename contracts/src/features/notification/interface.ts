import type { z } from "zod";
import type { IMessageResponse } from "../../common/interface.js";
import {
  fcmDeviceSchema,
  notificationSchema,
  paginatedNotificationsSchema,
  pushSubscriptionKeysSchema,
} from "./schema.js";

export interface INotification extends z.infer<typeof notificationSchema> {}

export interface IPaginatedNotifications
  extends z.infer<typeof paginatedNotificationsSchema> {}

export interface IPushSubscriptionKeys
  extends z.infer<typeof pushSubscriptionKeysSchema> {}

export interface IPushSubscription {
  id: string;
  userId: string;
  endpoint: string;
  keys: IPushSubscriptionKeys;
  userAgent?: string | null;
  deviceId?: string | null;
  createdAt: string;
}

export interface IFcmDevice extends z.infer<typeof fcmDeviceSchema> {}

export type TRegisterFcmDeviceResponse = IMessageResponse & {
  device: IFcmDevice;
};

export type TUnregisterFcmDeviceResponse = IMessageResponse & {
  removed: boolean;
};

export type TFcmDevicesListResponse = {
  devices: IFcmDevice[];
  count: number;
};

export type TUnreadCountResponse = { count: number };

export type TMarkAllReadResponse = IMessageResponse & { count: number };
