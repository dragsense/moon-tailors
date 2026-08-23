import { Body, Controller, Get, Param, Put } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import {
  EPermissionAction,
  EResource,
  upsertUserAvailabilitySchema,
  type TUpsertUserAvailability,
} from "@template/contracts";
import { CurrentUser, RequirePermissions } from "../../common/auth";
import { ZodValidationPipe } from "../../common/validation";
import { UserEntity } from "../../common/base";
import { UserAvailabilityEntity } from "./entities/user-availability.entity";
import { UserAvailabilityService } from "./user-availability.service";

@ApiTags("User availability")
@Controller("user-availability")
export class UserAvailabilityController {
  constructor(private readonly availability: UserAvailabilityService) {}

  @Get()
  @RequirePermissions({
    resource: EResource.USER_AVAILABILITY,
    action: EPermissionAction.READ,
  })
  mine(@CurrentUser() user: UserEntity): Promise<UserAvailabilityEntity> {
    return this.availability.getOrCreateForUser(user.id);
  }

  @Get(":userId")
  @RequirePermissions({
    resource: EResource.USER_AVAILABILITY,
    action: EPermissionAction.READ,
  })
  forUser(@Param("userId") userId: string): Promise<UserAvailabilityEntity> {
    return this.availability.getOrCreateForUser(userId);
  }

  @Put()
  @RequirePermissions({
    resource: EResource.USER_AVAILABILITY,
    action: EPermissionAction.UPDATE,
  })
  upsertMine(
    @CurrentUser() user: UserEntity,
    @Body(new ZodValidationPipe(upsertUserAvailabilitySchema))
    body: TUpsertUserAvailability,
  ): Promise<UserAvailabilityEntity> {
    return this.availability.upsert(user.id, body);
  }

  @Put(":userId")
  @RequirePermissions({
    resource: EResource.USER_AVAILABILITY,
    action: EPermissionAction.MANAGE,
  })
  upsertForUser(
    @Param("userId") userId: string,
    @Body(new ZodValidationPipe(upsertUserAvailabilitySchema))
    body: TUpsertUserAvailability,
  ): Promise<UserAvailabilityEntity> {
    return this.availability.upsert(userId, body);
  }
}
