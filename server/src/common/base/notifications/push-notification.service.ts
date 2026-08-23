import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { TCreatePushSubscriptionData } from "@template/contracts";
import * as webpush from "web-push";
import type { NotificationConfig } from "../../../config/notification.config";
import {
  EntityService,
  type IBoundEntityService,
} from "../../database";
import type { EntityQueryConfig } from "../../query";
import { FcmPushService } from "./fcm-push.service";
import { NotificationEntity } from "./entities/notification.entity";
import { PushSubscriptionEntity } from "./entities/push-subscription.entity";

export const PUSH_SUBSCRIPTION_QUERY: EntityQueryConfig = {
  alias: "pushSubscription",
  restrictedFields: ["keys"],
  sortable: ["createdAt"],
  defaultSort: { field: "createdAt", order: "DESC" },
};

@Injectable()
export class PushNotificationService {
  private readonly logger = new Logger(PushNotificationService.name);
  private readonly entity: IBoundEntityService<PushSubscriptionEntity>;
  private vapidReady = false;

  constructor(
    private readonly entityService: EntityService,
    private readonly config: ConfigService,
    private readonly fcm: FcmPushService,
  ) {
    this.entity = this.entityService.bind(
      PushSubscriptionEntity,
      PUSH_SUBSCRIPTION_QUERY,
    );
    this.initVapid();
  }

  async saveSubscription(
    userId: string,
    body: TCreatePushSubscriptionData,
    userAgent?: string,
  ): Promise<PushSubscriptionEntity> {
    const existing = await this.entity.get({ userId, endpoint: body.endpoint });

    if (existing) {
      return this.entity.update(existing.id, {
        keys: body.keys,
        userAgent: userAgent ?? null,
        deviceId: body.deviceId ?? null,
      });
    }

    return this.entity.create({
      userId,
      endpoint: body.endpoint,
      keys: body.keys,
      userAgent: userAgent ?? null,
      deviceId: body.deviceId ?? null,
    });
  }

  async removeSubscription(userId: string, endpoint: string): Promise<boolean> {
    const row = await this.entity.get({ userId, endpoint });
    if (!row) return false;
    await this.entity.hardDelete(row.id);
    return true;
  }

  async listSubscriptions(userId: string): Promise<PushSubscriptionEntity[]> {
    const page = await this.entity.list(
      { page: 1, limit: 1 },
      {
        access: { type: "eq", column: "userId", value: userId },
        skipPagination: true,
      },
    );
    return page.data;
  }

  /** Fan-out: browser Web Push + mobile FCM. */
  async sendPushNotification(
    userId: string,
    notification: NotificationEntity,
  ): Promise<{ sent: number; failed: number }> {
    const web = await this.sendWebPush(userId, notification);
    const fcm = await this.fcm.sendPushNotification(userId, notification);
    return {
      sent: web.sent + fcm.sent,
      failed: web.failed + fcm.failed,
    };
  }

  getVapidPublicKey(): string | undefined {
    return this.config.get<NotificationConfig>("notifications")?.push
      .vapidPublicKey;
  }

  private async sendWebPush(
    userId: string,
    notification: NotificationEntity,
  ): Promise<{ sent: number; failed: number }> {
    if (!this.vapidReady) {
      return { sent: 0, failed: 0 };
    }

    const rows = await this.listSubscriptions(userId);
    let sent = 0;
    let failed = 0;

    const payload = JSON.stringify({
      title: notification.title,
      body: notification.message,
      data: {
        id: notification.id,
        type: notification.type,
        entityType: notification.entityType,
      },
    });

    for (const row of rows) {
      try {
        await webpush.sendNotification(
          {
            endpoint: row.endpoint,
            keys: row.keys,
          },
          payload,
        );
        sent += 1;
      } catch (error) {
        failed += 1;
        const message = error instanceof Error ? error.message : String(error);
        this.logger.warn(`Web push failed for ${row.endpoint}: ${message}`);
        if (message.includes("410") || message.includes("404")) {
          await this.entity.hardDelete(row.id);
        }
      }
    }

    return { sent, failed };
  }

  private initVapid() {
    const settings = this.config.get<NotificationConfig>("notifications");
    const publicKey = settings?.push.vapidPublicKey;
    const privateKey = settings?.push.vapidPrivateKey;
    if (!publicKey || !privateKey) {
      this.logger.warn("VAPID keys not configured — web push disabled");
      return;
    }

    webpush.setVapidDetails(settings.push.vapidEmail, publicKey, privateKey);
    this.vapidReady = true;
  }
}
