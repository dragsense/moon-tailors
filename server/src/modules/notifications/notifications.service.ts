import { Injectable, NotFoundException, OnModuleInit } from "@nestjs/common";
import type {
  IMessageResponse,
  IPaginatedResponse,
  TCreatePushSubscriptionData,
  TMarkAllReadResponse,
  TNotificationListQuery,
  TRegisterFcmDeviceData,
  TUnregisterFcmDeviceResponse,
  TUnreadCountResponse,
} from "@template/contracts";
import {
  ENotificationPriority,
  ENotificationType,
  EResource,
} from "@template/contracts";
import {
  BaseNotificationsService,
  FcmPushService,
  FcmDeviceTokenEntity,
  NotificationEntity,
  NotificationSenderService,
  PermissionsService,
  PushNotificationService,
  PushSubscriptionEntity,
} from "../../common/base";
import type { EntityKey } from "../../common/query";

@Injectable()
export class NotificationsService implements OnModuleInit {
  constructor(
    private readonly store: BaseNotificationsService,
    private readonly sender: NotificationSenderService,
    private readonly push: PushNotificationService,
    private readonly fcm: FcmPushService,
    private readonly permissions: PermissionsService,
  ) {}

  async onModuleInit() {
    await this.permissions.ensureResource(EResource.NOTIFICATIONS);
  }

  list(
    userId: string,
    query: TNotificationListQuery,
  ): Promise<IPaginatedResponse<NotificationEntity>> {
    return this.store.list(userId, query);
  }

  async unreadCount(userId: string): Promise<TUnreadCountResponse> {
    return { count: await this.store.getUnreadCount(userId) };
  }

  async markAsRead(
    userId: string,
    id: EntityKey,
  ): Promise<IMessageResponse> {
    await this.store.markAsRead(id, userId);
    this.sender.emitRead(userId, String(id));
    return { message: "Notification marked as read" };
  }

  async markAllAsRead(userId: string): Promise<TMarkAllReadResponse> {
    const count = await this.store.markAllAsRead(userId);
    return { message: `${count} notification(s) marked as read`, count };
  }

  async remove(userId: string, id: EntityKey): Promise<IMessageResponse> {
    await this.store.remove(id, userId);
    return { message: "Notification deleted" };
  }

  subscribePush(
    userId: string,
    body: TCreatePushSubscriptionData,
    userAgent?: string,
  ): Promise<PushSubscriptionEntity> {
    return this.push.saveSubscription(userId, body, userAgent);
  }

  unsubscribePush(userId: string, endpoint: string) {
    if (!endpoint) throw new NotFoundException("Endpoint required");
    return this.push.removeSubscription(userId, endpoint).then((removed) => ({
      message: removed ? "Unsubscribed" : "Subscription not found",
    }));
  }

  listPushSubscriptions(userId: string): Promise<PushSubscriptionEntity[]> {
    return this.push.listSubscriptions(userId);
  }

  getVapidPublicKey() {
    return { publicKey: this.push.getVapidPublicKey() };
  }

  async registerFcmDevice(
    userId: string,
    body: TRegisterFcmDeviceData,
  ): Promise<IMessageResponse & { device: FcmDeviceTokenEntity }> {
    const device = await this.fcm.saveDevice(userId, body);
    return { message: "FCM device registered", device };
  }

  async unregisterFcmDevice(
    userId: string,
    token: string,
  ): Promise<TUnregisterFcmDeviceResponse> {
    if (!token) throw new NotFoundException("Token required");
    const removed = await this.fcm.removeDevice(userId, token);
    return {
      message: removed ? "FCM device removed" : "FCM device not found",
      removed,
    };
  }

  async listFcmDevices(
    userId: string,
  ): Promise<{ devices: FcmDeviceTokenEntity[]; count: number }> {
    const devices = await this.fcm.listDevices(userId);
    return { devices, count: devices.length };
  }

  /** Used by feature modules (chat, tasks, …). */
  notifyUser(input: {
    recipientId: string;
    title: string;
    message: string;
    entityType?: string;
    metadata?: Record<string, unknown>;
    type?: ENotificationType;
    priority?: ENotificationPriority;
  }): Promise<NotificationEntity> {
    return this.sender.createAndSend({
      recipientId: input.recipientId,
      title: input.title,
      message: input.message,
      entityType: input.entityType,
      metadata: input.metadata,
      type: input.type ?? ENotificationType.INFO,
      priority: input.priority ?? ENotificationPriority.NORMAL,
    });
  }
}
