import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Put,
} from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import type {
  IEntitySettingsResponse,
  TDeleteEntitySettingResponse,
  TSaveEntitySettingsData,
  TSaveEntitySettingsResponse,
} from "@template/contracts";
import {
  EPermissionAction,
  EResource,
  saveEntitySettingsSchema,
} from "@template/contracts";
import type { UserEntity } from "../../common/base";
import { CurrentUser, RequirePermissions } from "../../common/auth";
import { ZodValidationPipe } from "../../common/validation";
import { EntitySettingsService } from "./entity-settings.service";

@ApiTags("Entity settings")
@Controller("entity-settings")
export class EntitySettingsController {
  constructor(private readonly entitySettings: EntitySettingsService) {}

  @Get("me")
  @RequirePermissions({
    resource: EResource.SETTINGS,
    action: EPermissionAction.READ,
  })
  getMine(@CurrentUser() user: UserEntity): Promise<IEntitySettingsResponse> {
    return this.entitySettings.getSettings(user, "me");
  }

  @Put("me")
  @RequirePermissions({
    resource: EResource.SETTINGS,
    action: EPermissionAction.UPDATE,
  })
  saveMine(
    @CurrentUser() user: UserEntity,
    @Body(new ZodValidationPipe(saveEntitySettingsSchema))
    body: TSaveEntitySettingsData,
  ): Promise<TSaveEntitySettingsResponse> {
    return this.entitySettings.saveSettings(user, "me", body);
  }

  @Get(":entityId")
  @RequirePermissions({
    resource: EResource.SETTINGS,
    action: EPermissionAction.READ,
  })
  getByEntity(
    @CurrentUser() user: UserEntity,
    @Param("entityId") entityId: string,
  ): Promise<IEntitySettingsResponse> {
    return this.entitySettings.getSettings(user, entityId);
  }

  @Put(":entityId")
  @RequirePermissions({
    resource: EResource.SETTINGS,
    action: EPermissionAction.UPDATE,
  })
  saveByEntity(
    @CurrentUser() user: UserEntity,
    @Param("entityId") entityId: string,
    @Body(new ZodValidationPipe(saveEntitySettingsSchema))
    body: TSaveEntitySettingsData,
  ): Promise<TSaveEntitySettingsResponse> {
    return this.entitySettings.saveSettings(user, entityId, body);
  }

  @Delete(":entityId/keys/:key")
  @RequirePermissions({
    resource: EResource.SETTINGS,
    action: EPermissionAction.DELETE,
  })
  deleteKey(
    @CurrentUser() user: UserEntity,
    @Param("entityId") entityId: string,
    @Param("key") key: string,
  ): Promise<TDeleteEntitySettingResponse> {
    return this.entitySettings.deleteSetting(user, entityId, key);
  }
}
