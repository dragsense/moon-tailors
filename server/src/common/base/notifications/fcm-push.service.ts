import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { TRegisterFcmDeviceData } from "@template/contracts";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getMessaging, type Message } from "firebase-admin/messaging";
import type { NotificationConfig } from "../../../config/notification.config";
import {
  EntityService,
  type IBoundEntityService,
} from "../../database";
import type { EntityQueryConfig } from "../../query";
import { FcmDeviceTokenEntity } from "./entities/fcm-device-token.entity";
import { NotificationEntity } from "./entities/notification.entity";

export const FCM_DEVICE_QUERY: EntityQueryConfig = {
  alias: "fcmDevice",
  restrictedFields: ["token"],
  sortable: ["createdAt"],
  defaultSort: { field: "createdAt", order: "DESC" },
};

@Injectable()
export class FcmPushService implements OnModuleInit {
  private readonly logger = new Logger(FcmPushService.name);
  private readonly entity: IBoundEntityService<FcmDeviceTokenEntity>;
  private initialized = false;

  constructor(
    private readonly entityService: EntityService,
    private readonly config: ConfigService,
  ) {
    this.entity = this.entityService.bind(
      FcmDeviceTokenEntity,
      FCM_DEVICE_QUERY,
    );
  }

  onModuleInit() {
    this.initFirebase();
  }

  isReady() {
    return this.initialized;
  }

  async saveDevice(
    userId: string,
    body: TRegisterFcmDeviceData,
  ): Promise<FcmDeviceTokenEntity> {
    const existingByToken = await this.entity.get({
      userId,
      token: body.token,
    });

    if (existingByToken) {
      return this.entity.update(existingByToken.id, {
        platform: body.platform,
        deviceId: body.deviceId ?? existingByToken.deviceId,
      });
    }

    if (body.deviceId) {
      const existingByDevice = await this.entity.get({
        userId,
        deviceId: body.deviceId,
      });
      if (existingByDevice) {
        return this.entity.update(existingByDevice.id, {
          token: body.token,
          platform: body.platform,
        });
      }
    }

    return this.entity.create({
      userId,
      token: body.token,
      platform: body.platform,
      deviceId: body.deviceId ?? null,
    });
  }

  async removeDevice(userId: string, token: string): Promise<boolean> {
    const row = await this.entity.get({ userId, token });
    if (!row) return false;
    await this.entity.hardDelete(row.id);
    return true;
  }

  async listDevices(userId: string): Promise<FcmDeviceTokenEntity[]> {
    const page = await this.entity.list(
      { page: 1, limit: 1 },
      {
        access: { type: "eq", column: "userId", value: userId },
        skipPagination: true,
      },
    );
    return page.data;
  }

  async sendPushNotification(
    userId: string,
    notification: NotificationEntity,
  ): Promise<{ sent: number; failed: number }> {
    const devices = await this.listDevices(userId);
    if (devices.length === 0) return { sent: 0, failed: 0 };

    if (!this.initialized) {
      this.logger.warn("Firebase Admin not initialized — skipping FCM");
      return { sent: 0, failed: devices.length };
    }

    const results = await Promise.allSettled(
      devices.map((device) => this.sendToDevice(device, notification)),
    );

    const sent = results.filter(
      (r) => r.status === "fulfilled" && r.value === true,
    ).length;

    return { sent, failed: results.length - sent };
  }

  private async sendToDevice(
    device: FcmDeviceTokenEntity,
    notification: NotificationEntity,
  ): Promise<boolean> {
    try {
      await getMessaging().send(this.buildMessage(device.token, notification));
      return true;
    } catch (error) {
      const code =
        error && typeof error === "object" && "code" in error
          ? String((error as { code: string }).code)
          : undefined;
      const message = error instanceof Error ? error.message : String(error);

      if (
        code === "messaging/invalid-registration-token" ||
        code === "messaging/registration-token-not-registered"
      ) {
        this.logger.warn(`Removing invalid FCM token ${device.id}`);
        await this.entity.hardDelete(device.id);
      } else {
        this.logger.error(`FCM send failed for ${device.id}: ${message}`);
      }
      return false;
    }
  }

  private buildMessage(
    token: string,
    notification: NotificationEntity,
  ): Message {
    const data: Record<string, string> = {
      id: notification.id,
      type: String(notification.type),
      priority: String(notification.priority),
      entityType: notification.entityType ?? "",
    };

    if (notification.metadata) {
      try {
        data.metadata = JSON.stringify(notification.metadata);
      } catch {
        /* ignore */
      }
    }

    return {
      token,
      notification: {
        title: notification.title,
        body: notification.message,
      },
      data,
      android: {
        priority: "high",
        notification: {
          channelId: "high_importance_channel",
        },
      },
      apns: {
        payload: {
          aps: {
            sound: "default",
            badge: 1,
          },
        },
      },
    };
  }

  private initFirebase() {
    if (getApps().length > 0) {
      this.initialized = true;
      return;
    }

    const settings = this.config.get<NotificationConfig>("notifications");
    const projectId = settings?.firebase?.projectId;
    const clientEmail = settings?.firebase?.clientEmail;
    const privateKeyRaw = settings?.firebase?.privateKey;

    if (!projectId || !clientEmail || !privateKeyRaw) {
      this.logger.warn(
        "Firebase credentials missing — FCM disabled (set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY)",
      );
      return;
    }

    try {
      initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey: privateKeyRaw.replace(/\\n/g, "\n"),
        }),
        projectId,
      });
      this.initialized = true;
      this.logger.log("Firebase Admin initialized for FCM");
    } catch (error) {
      this.logger.error(
        `Firebase init failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
}
