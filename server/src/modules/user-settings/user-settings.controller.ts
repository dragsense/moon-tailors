import {
  Body,
  Controller,
  Get,
  Put,
} from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import type {
  IUserSettingsResponse,
  TSaveUserSettingsData,
  TSaveUserSettingsResponse,
} from "@moon-tailors/contracts";
import {
  EPermissionAction,
  EResource,
  saveUserSettingsSchema,
} from "@moon-tailors/contracts";
import type { UserEntity } from "../../common/base";
import { CurrentUser, RequirePermissions } from "../../common/auth";
import { ZodValidationPipe } from "../../common/validation";
import { UserSettingsService } from "./user-settings.service";

@ApiTags("User settings")
@Controller("user-settings")
export class UserSettingsController {
  constructor(private readonly userSettings: UserSettingsService) {}

  @Get("me")
  @RequirePermissions({
    resource: EResource.SETTINGS,
    action: EPermissionAction.READ,
  })
  getMine(@CurrentUser() user: UserEntity): Promise<IUserSettingsResponse> {
    return this.userSettings.getSettings(user, "me");
  }

  @Put("me")
  @RequirePermissions({
    resource: EResource.SETTINGS,
    action: EPermissionAction.UPDATE,
  })
  saveMine(
    @CurrentUser() user: UserEntity,
    @Body(new ZodValidationPipe(saveUserSettingsSchema))
    body: TSaveUserSettingsData,
  ): Promise<TSaveUserSettingsResponse> {
    return this.userSettings.saveSettings(user, "me", body);
  }
}
