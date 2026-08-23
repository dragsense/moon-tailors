import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from "@nestjs/common";
import { ApiHeader, ApiTags } from "@nestjs/swagger";
import {
  createScheduleSchema,
  EPermissionAction,
  EResource,
  EUserLevel,
  scheduleListQuerySchema,
  type IMessageResponse,
  type IPaginatedResponse,
  type TCreateScheduleData,
  type TScheduleListQuery,
  type TUpdateScheduleData,
  updateScheduleSchema,
} from "@template/contracts";
import {
  RequirePermissions,
  RequireUserLevels,
} from "../auth";
import { Timezone } from "../context";
import { ZodValidationPipe } from "../validation";
import { ScheduleEntity } from "./entities";
import { ScheduleService } from "./schedule.service";

@ApiTags("Schedules")
@Controller("schedules")
@RequireUserLevels(
  EUserLevel.PLATFORM_OWNER,
  EUserLevel.SUPER_ADMIN,
  EUserLevel.ADMIN,
)
export class ScheduleController {
  constructor(private readonly schedules: ScheduleService) {}

  @Get()
  @RequirePermissions({
    resource: EResource.SCHEDULES,
    action: EPermissionAction.READ,
  })
  list(
    @Query(new ZodValidationPipe(scheduleListQuerySchema))
    query: TScheduleListQuery,
  ): Promise<IPaginatedResponse<ScheduleEntity>> {
    return this.schedules.list(query);
  }

  @Get(":id")
  @RequirePermissions({
    resource: EResource.SCHEDULES,
    action: EPermissionAction.READ,
  })
  get(@Param("id") id: string): Promise<ScheduleEntity> {
    return this.schedules.get(id);
  }

  @Post()
  @ApiHeader({
    name: "X-Timezone",
    description: "IANA timezone from the browser",
    required: false,
  })
  @RequirePermissions({
    resource: EResource.SCHEDULES,
    action: EPermissionAction.CREATE,
  })
  create(
    @Body(new ZodValidationPipe(createScheduleSchema))
    body: TCreateScheduleData,
    @Timezone() timezone: string,
  ): Promise<ScheduleEntity> {
    return this.schedules.createSchedule(body, timezone);
  }

  @Patch(":id")
  @ApiHeader({
    name: "X-Timezone",
    description: "IANA timezone from the browser",
    required: false,
  })
  @RequirePermissions({
    resource: EResource.SCHEDULES,
    action: EPermissionAction.UPDATE,
  })
  update(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(updateScheduleSchema))
    body: TUpdateScheduleData,
    @Timezone() timezone: string,
  ): Promise<ScheduleEntity> {
    return this.schedules.updateSchedule(id, body, timezone);
  }

  @Delete(":id")
  @RequirePermissions({
    resource: EResource.SCHEDULES,
    action: EPermissionAction.DELETE,
  })
  async remove(@Param("id") id: string): Promise<IMessageResponse> {
    await this.schedules.softDelete(id);
    return { message: "Schedule deleted" };
  }
}
