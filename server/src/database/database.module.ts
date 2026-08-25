import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import type { DatabaseConfig } from "../config";
import { dataSourceOptions } from "./data-source";
import {
  BusinessEntity,
  PermissionEntity,
  SettingEntity,
  UserEntity,
  UserPermissionEntity,
} from "../common/base";
import { ActivityLogEntity } from "../common/activity-logs";
import { AuditSubscriber } from "../common/entities/audit.subscriber";

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
            SettingEntity,
            ActivityLogEntity,
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
