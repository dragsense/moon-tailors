import { Injectable, Logger } from "@nestjs/common";
import { BaseSettingsService } from "../settings/base-settings.service";
import { BaseUsersService } from "../users/base-users.service";
import { ServerGateway } from "../../gateways/server.gateway";
import { BaseNotificationsService } from "./base-notifications.service";
import { EmailNotificationService } from "./email-notification.service";
import { NotificationEntity } from "./entities/notification.entity";
import { PushNotificationService } from "./push-notification.service";

type NotificationPreferences = {
  inAppEnabled: boolean;
  pushEnabled: boolean;
  emailEnabled: boolean;
};

@Injectable()
export class NotificationSenderService {
  private readonly logger = new Logger(NotificationSenderService.name);

  constructor(
    private readonly gateway: ServerGateway,
    private readonly settings: BaseSettingsService,
    private readonly usersService: BaseUsersService,
    private readonly pushService: PushNotificationService,
    private readonly emailService: EmailNotificationService,
    private readonly notificationsService: BaseNotificationsService,
  ) {}

  async createAndSend(
    input: Parameters<BaseNotificationsService["create"]>[0],
  ): Promise<NotificationEntity> {
    const notification = await this.notificationsService.create(input);
    await this.send(notification);
    return notification;
  }

  async send(notification: NotificationEntity): Promise<{
    inApp: boolean;
    push: boolean;
    email: boolean;
  }> {
    const result = { inApp: false, push: false, email: false };
    const user = await this.usersService.findById(notification.recipientId);
    if (!user) {
      this.logger.warn(`Recipient ${notification.recipientId} not found`);
      return result;
    }

    const prefs = await this.getPreferences(notification.recipientId);

    if (prefs.inAppEnabled) {
      try {
        this.gateway.emitToRoom(
          this.userRoom(notification.recipientId),
          "notification",
          notification,
        );
        result.inApp = true;
      } catch (error) {
        this.logger.error(
          `In-app notification failed: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }

    if (prefs.pushEnabled) {
      try {
        const push = await this.pushService.sendPushNotification(
          notification.recipientId,
          notification,
        );
        result.push = push.sent > 0;
      } catch (error) {
        this.logger.error(
          `Push notification failed: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }

    if (prefs.emailEnabled) {
      try {
        result.email = await this.emailService.sendForNotification(notification);
      } catch (error) {
        this.logger.error(
          `Email notification failed: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }

    return result;
  }

  emitRead(recipientId: string, notificationId: string) {
    this.gateway.emitToRoom(
      this.userRoom(recipientId),
      "notificationRead",
      notificationId,
    );
  }

  private userRoom(userId: string) {
    return `user:${userId}`;
  }

  private async getPreferences(
    recipientId: string,
  ): Promise<NotificationPreferences> {
    try {
      const settings = await this.settings.getSettings(recipientId);
      const notifications = (settings.notifications ?? {}) as Partial<
        NotificationPreferences & { bellEnabled?: boolean }
      >;
      return {
        inAppEnabled: notifications.inAppEnabled ?? true,
        pushEnabled: notifications.pushEnabled ?? false,
        emailEnabled: notifications.emailEnabled ?? true,
      };
    } catch {
      return {
        inAppEnabled: true,
        pushEnabled: false,
        emailEnabled: true,
      };
    }
  }
}
