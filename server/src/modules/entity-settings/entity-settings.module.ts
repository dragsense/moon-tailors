import { Module } from "@nestjs/common";
import { BaseSettingsModule, PermissionsModule } from "../../common/base";
import { EntitySettingsController } from "./entity-settings.controller";
import { EntitySettingsService } from "./entity-settings.service";

@Module({
  imports: [BaseSettingsModule, PermissionsModule],
  controllers: [EntitySettingsController],
  providers: [EntitySettingsService],
  exports: [EntitySettingsService],
})
export class EntitySettingsModule {}
