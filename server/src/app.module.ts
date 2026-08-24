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
import { ActionModule } from "./common/actions";
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
import { EntitySettingsModule } from "./modules/entity-settings/entity-settings.module";
import { UsersModule } from "./modules/users/users.module";
import { DashboardModule } from "./modules/dashboard";
import { CustomersModule } from "./modules/customers/customers.module";
import { MeasurementsModule } from "./modules/measurements/measurements.module";
import { OrdersModule } from "./modules/orders/orders.module";
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
    ServerGatewayModule,
    AuthModule,
    BusinessModule,
    UsersModule,
    EntitySettingsModule,
    MeasurementsModule,
    CustomersModule,
    OrdersModule,
    DashboardModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
