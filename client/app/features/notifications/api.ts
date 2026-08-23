import type {
  IMessageResponse,
  INotification,
  IPaginatedNotifications,
  IPushSubscription,
  TCreatePushSubscriptionData,
  TFcmDevicesListResponse,
  TMarkAllReadResponse,
  TRegisterFcmDeviceData,
  TRegisterFcmDeviceResponse,
  TUnregisterFcmDeviceResponse,
  TUnreadCountResponse,
} from "@template/contracts";
import { BaseService } from "~/lib/api";

class NotificationsService extends BaseService<INotification> {
  constructor() {
    super("/notifications");
  }

  list(
    query: {
      page?: number;
      limit?: number;
      unreadOnly?: boolean;
    } = {},
  ) {
    const { page = 1, limit = 20, unreadOnly } = query;
    return this.get<INotification>({
      page,
      limit,
      ...(unreadOnly ? { unreadOnly: true } : {}),
    }) as Promise<IPaginatedNotifications>;
  }

  remove(id: string) {
    return this.delete(id) as Promise<IMessageResponse>;
  }

  unreadCount() {
    return this.getSingle<TUnreadCountResponse>(
      undefined,
      undefined,
      "/unread-count",
    );
  }

  markRead(id: string) {
    return this.put<IMessageResponse>()({}, undefined, `/${id}/read`);
  }

  markAllRead() {
    return this.put<TMarkAllReadResponse>()({}, undefined, "/read-all");
  }

  vapidPublicKey() {
    return this.getSingle<{ publicKey?: string }>(
      undefined,
      undefined,
      "/push/vapid-public-key",
    );
  }

  subscribePush(body: TCreatePushSubscriptionData) {
    return this.post<IPushSubscription>(
      body as never,
      undefined,
      "/push/subscribe",
    );
  }

  unsubscribePush(endpoint: string) {
    return this.delete<{ message: string }>(undefined, { endpoint }, "/push/unsubscribe");
  }

  registerFcmDevice(body: TRegisterFcmDeviceData) {
    return this.post<TRegisterFcmDeviceResponse>(
      body as never,
      undefined,
      "/push/device",
    );
  }

  unregisterFcmDevice(token: string) {
    return this.delete<TUnregisterFcmDeviceResponse>(
      undefined,
      { token },
      "/push/device",
    );
  }

  listFcmDevices() {
    return this.getSingle<TFcmDevicesListResponse>(
      undefined,
      undefined,
      "/push/devices",
    );
  }
}

export const notificationsService = new NotificationsService();

/** @deprecated Prefer `notificationsService` — kept for existing call sites. */
export const listNotifications = (query?: {
  page?: number;
  limit?: number;
  unreadOnly?: boolean;
}) => notificationsService.list(query);

export const getUnreadNotificationCount = () =>
  notificationsService.unreadCount();

export const markNotificationRead = (id: string) =>
  notificationsService.markRead(id);

export const markAllNotificationsRead = () =>
  notificationsService.markAllRead();

export const deleteNotification = (id: string) =>
  notificationsService.remove(id);

export const getVapidPublicKey = () => notificationsService.vapidPublicKey();

export const subscribePush = (body: TCreatePushSubscriptionData) =>
  notificationsService.subscribePush(body);

export const unsubscribePush = (endpoint: string) =>
  notificationsService.unsubscribePush(endpoint);

export const registerFcmDevice = (body: TRegisterFcmDeviceData) =>
  notificationsService.registerFcmDevice(body);

export const unregisterFcmDevice = (token: string) =>
  notificationsService.unregisterFcmDevice(token);

export const listFcmDevices = () => notificationsService.listFcmDevices();
