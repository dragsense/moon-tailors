import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import type { DatabaseConfig } from "../config";
import { dataSourceOptions } from "./data-source";
import {
  BusinessEntity,
  BusinessThemeEntity,
  ChatEntity,
  ChatMessageEntity,
  ChatParticipantEntity,
  PermissionEntity,
  SettingEntity,
  UserEntity,
  UserPermissionEntity,
  NotificationEntity,
  PushSubscriptionEntity,
  FcmDeviceTokenEntity,
} from "../common/base";
import { SentEmailEntity } from "../common/email";
import { ActivityLogEntity } from "../common/activity-logs";
import { PaymentProcessorEntity } from "../common/payment-processors";
import { AiProcessorEntity } from "../common/ai-processors";
import { ScheduleEntity } from "../common/schedule";
import { FileUploadEntity } from "../common/file-upload";
import { AuditSubscriber } from "../common/entities/audit.subscriber";
import { OtpChallengeEntity } from "../modules/auth/entities/otp-challenge.entity";
import { RefreshTokenEntity } from "../modules/auth/entities/refresh-token.entity";
import { TrustedDeviceEntity } from "../modules/auth/entities/trusted-device.entity";

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const database = config.getOrThrow<DatabaseConfig>("database");
        return {
          ...dataSourceOptions,
          url: database.url,
          entities: [
            UserEntity,
            PermissionEntity,
            UserPermissionEntity,
            BusinessEntity,
            BusinessThemeEntity,
            ChatEntity,
            ChatMessageEntity,
            ChatParticipantEntity,
            SettingEntity,
            NotificationEntity,
            PushSubscriptionEntity,
            SentEmailEntity,
            FcmDeviceTokenEntity,
            ActivityLogEntity,
            PaymentProcessorEntity,
            AiProcessorEntity,
            ScheduleEntity,
            FileUploadEntity,
            OtpChallengeEntity,
            RefreshTokenEntity,
            TrustedDeviceEntity,
          ],
          subscribers: [AuditSubscriber],
          autoLoadEntities: true,
          synchronize: database.synchronize,
        };
      },
    }),
  ],
})
export class DatabaseModule {}
