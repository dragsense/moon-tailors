import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { BaseSettingsService } from "./base-settings.service";
import { SettingEntity } from "./entities";

@Module({
  imports: [TypeOrmModule.forFeature([SettingEntity])],
  providers: [BaseSettingsService],
  exports: [BaseSettingsService, TypeOrmModule],
})
export class BaseSettingsModule {}
