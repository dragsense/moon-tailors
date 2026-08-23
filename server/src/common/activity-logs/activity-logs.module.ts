import { Module, OnModuleInit } from "@nestjs/common";
import { APP_INTERCEPTOR } from "@nestjs/core";
import { TypeOrmModule } from "@nestjs/typeorm";
import { PermissionsModule } from "../base/permissions";
import { ActivityLogEntity } from "./entities";
import { ActivityLogsService } from "./activity-logs.service";
import { ActivityLogsController } from "./activity-logs.controller";
import { ActivityLogInterceptor } from "./interceptors/activity-log.interceptor";
import { ActivityLogRegistry } from "./activity-log.registry";

@Module({
  imports: [TypeOrmModule.forFeature([ActivityLogEntity]), PermissionsModule],
  controllers: [ActivityLogsController],
  providers: [
    ActivityLogsService,
    {
      provide: APP_INTERCEPTOR,
      useClass: ActivityLogInterceptor,
    },
  ],
  exports: [ActivityLogsService],
})
export class ActivityLogsModule implements OnModuleInit {
  constructor(private readonly activityLogs: ActivityLogsService) {}

  async onModuleInit() {
    await this.activityLogs.onModuleInit();
    // Self-register so admins can see registry endpoint activity when enabled.
    ActivityLogRegistry.register({
      module: "activity-logs",
      endpoints: ["/api/activity-logs"],
      methods: ["DELETE", "POST", "PUT", "PATCH"],
    });
  }
}
