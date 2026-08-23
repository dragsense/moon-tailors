import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ServerGatewayModule } from "../../gateways";
import { BaseSettingsModule } from "../settings/base-settings.module";
import { BaseUsersModule } from "../users/base-users.module";
import { BaseNotificationsService } from "./base-notifications.service";
import { EmailNotificationService } from "./email-notification.service";
import {
  FcmDeviceTokenEntity,
  NotificationEntity,
  PushSubscriptionEntity,
} from "./entities";
import { FcmPushService } from "./fcm-push.service";
import { NotificationSenderService } from "./notification-sender.service";
import { PushNotificationService } from "./push-notification.service";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      NotificationEntity,
      PushSubscriptionEntity,
      FcmDeviceTokenEntity,
    ]),
    BaseUsersModule,
    BaseSettingsModule,
    ServerGatewayModule,
  ],
  providers: [
    BaseNotificationsService,
    NotificationSenderService,
    PushNotificationService,
    FcmPushService,
    EmailNotificationService,
  ],
  exports: [
    BaseNotificationsService,
    NotificationSenderService,
    PushNotificationService,
    FcmPushService,
    EmailNotificationService,
    TypeOrmModule,
  ],
})
export class BaseNotificationsModule {}
