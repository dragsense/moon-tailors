import { Controller, Get, Query } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import {
  EPermissionAction,
  EResource,
  EUserLevel,
  listQuerySchema,
  type IPaginatedResponse,
  type TListQuery,
} from "@moon-tailors/contracts";
import { RequirePermissions, RequireUserLevels } from "../auth";
import { ZodValidationPipe } from "../validation";
import { ActivityLogsService } from "./activity-logs.service";
import { ActivityLogRegistry } from "./activity-log.registry";
import { ActivityLogEntity } from "./entities";

@ApiTags("Activity logs")
@Controller("activity-logs")
@RequireUserLevels(
  EUserLevel.PLATFORM_OWNER,
  EUserLevel.SUPER_ADMIN,
  EUserLevel.ADMIN,
)
export class ActivityLogsController {
  constructor(private readonly activityLogs: ActivityLogsService) {}

  @Get("registry")
  @RequirePermissions({
    resource: EResource.ACTIVITY_LOGS,
    action: EPermissionAction.READ,
  })
  registry() {
    return {
      enabled: this.activityLogs.isGloballyEnabled(),
      rules: ActivityLogRegistry.list(),
    };
  }

  @Get()
  @RequirePermissions({
    resource: EResource.ACTIVITY_LOGS,
    action: EPermissionAction.READ,
  })
  list(
    @Query(new ZodValidationPipe(listQuerySchema)) query: TListQuery,
  ): Promise<IPaginatedResponse<ActivityLogEntity>> {
    return this.activityLogs.list(query);
  }
}
