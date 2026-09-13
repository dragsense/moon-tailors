import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ContextModule } from "./common/context";
import { LoggingModule } from "./common/logging";
import { TenantModule } from "./common/tenant";
import { TenantDatabaseModule } from "./common/database";
import { ActivityLogsModule } from "./common/activity-logs";
import { EventsModule } from "./common/events";
import { BrowserHtmlModule } from "./common/http";
import { CacheModule } from "./common/cache";
import {
  configOptions,
} from "./config";
import { DatabaseModule } from "./database/database.module";
import { HealthController } from "./health.controller";
import { AuthModule } from "./modules/auth/auth.module";
import { BusinessModule } from "./modules/business";
import { UserSettingsModule } from "./modules/user-settings/user-settings.module";
import { UsersModule } from "./modules/users/users.module";
import { DashboardModule } from "./modules/dashboard";
import { CustomersModule } from "./modules/customers/customers.module";
import { MeasurementsModule } from "./modules/measurements/measurements.module";
import { OrdersModule } from "./modules/orders/orders.module";
import { StaffModule } from "./modules/staff/staff.module";
import { VendorsModule } from "./modules/vendors/vendors.module";
import { ServerGatewayModule } from "./common/gateways";

@Module({
  imports: [
    ConfigModule.forRoot(configOptions),
    ContextModule,
    LoggingModule,
    DatabaseModule,
    TenantDatabaseModule,
    TenantModule,
    BrowserHtmlModule,
    CacheModule,
    ActivityLogsModule,
    EventsModule,
    ServerGatewayModule,
    AuthModule,
    BusinessModule,
    UsersModule,
    UserSettingsModule,
    MeasurementsModule,
    CustomersModule,
    OrdersModule,
    StaffModule,
    VendorsModule,
    DashboardModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
