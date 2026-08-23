import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { BullModule } from "@nestjs/bull";
import { MailerModule } from "@nestjs-modules/mailer";
import { ContextModule } from "./common/context";
import { EncryptionModule } from "./common/encryption/encryption.module";
import { LoggingModule } from "./common/logging";
import { TenantModule } from "./common/tenant";
import { TenantDatabaseModule } from "./common/database";
import { ActivityLogsModule } from "./common/activity-logs";
import { EventsModule } from "./common/events";
import { BrowserHtmlModule } from "./common/http";
import { PaymentProcessorsModule } from "./common/payment-processors";
import { AiProcessorsModule } from "./common/ai-processors";
import { MqttModule } from "./common/mqtt";
import { ActionModule } from "./common/actions";
import { ScheduleModule } from "./common/schedule";
import { CacheModule } from "./common/cache";
import { FileUploadModule } from "./common/file-upload";
import { EmailModule } from "./common/email";
import { AppBullBoardModule } from "./common/bull-board";
import {
  configOptions,
  getBullQueueConfig,
  getMailerConfig,
  isBullBoardEnabled,
} from "./config";
import { DatabaseModule } from "./database/database.module";
import { HealthController } from "./health.controller";
import { AuthModule } from "./modules/auth/auth.module";
import { BusinessModule } from "./modules/business";
import { ChatModule } from "./modules/chat/chat.module";
import { EntitySettingsModule } from "./modules/entity-settings/entity-settings.module";
import { NotificationsModule } from "./modules/notifications/notifications.module";
import { TasksModule } from "./modules/tasks/tasks.module";
import { UsersModule } from "./modules/users/users.module";
import { UserAvailabilityModule } from "./modules/user-availability/user-availability.module";
import { BillingModule } from "./modules/billing/billing.module";
import { PaymentAdapterModule } from "./modules/payment-adapter/payment-adapter.module";
import { AiAdapterModule } from "./modules/ai-adapter";
import { CamerasModule } from "./modules/cameras";
import { DashboardModule } from "./modules/dashboard";
import { SmsInboxModule } from "./modules/sms";
import { EmailInboxModule } from "./modules/email";
import { SmsModule } from "./common/communications";
import { ServerGatewayModule } from "./common/gateways";

@Module({
  imports: [
    ConfigModule.forRoot(configOptions),
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: getBullQueueConfig,
    }),
    ...(isBullBoardEnabled() ? [AppBullBoardModule.register()] : []),
    MailerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: getMailerConfig,
    }),
    ContextModule,
    LoggingModule,
    EncryptionModule,
    DatabaseModule,
    TenantDatabaseModule,
    TenantModule,
    BrowserHtmlModule,
    CacheModule,
    EmailModule,
    FileUploadModule,
    ActionModule,
    ActivityLogsModule,
    EventsModule,
    ScheduleModule,
    PaymentProcessorsModule,
    AiProcessorsModule,
    SmsModule,
    MqttModule,
    ServerGatewayModule,
    AuthModule,
    BusinessModule,
    TasksModule,
    UsersModule,
    UserAvailabilityModule,
    BillingModule,
    PaymentAdapterModule,
    AiAdapterModule,
    ChatModule,
    EntitySettingsModule,
    NotificationsModule,
    CamerasModule,
    DashboardModule,
    SmsInboxModule,
    EmailInboxModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
