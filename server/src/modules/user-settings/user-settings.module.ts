import { Module } from "@nestjs/common";
import { BaseSettingsModule, PermissionsModule } from "../../common/base";
import { UserSettingsController } from "./user-settings.controller";
import { UserSettingsService } from "./user-settings.service";

@Module({
  imports: [BaseSettingsModule, PermissionsModule],
  controllers: [UserSettingsController],
  providers: [UserSettingsService],
  exports: [UserSettingsService],
})
export class UserSettingsModule {}
