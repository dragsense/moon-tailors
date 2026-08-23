import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { FileUploadModule } from "../../file-upload";
import { BaseUsersModule } from "../users";
import { BusinessEntity, BusinessThemeEntity } from "./entities";
import { BaseBusinessService } from "./base-business.service";
import { BaseBusinessThemeService } from "./base-business-theme.service";
import { PlatformBusinessSeed } from "./seeder/platform-business.seed";

@Module({
  imports: [
    TypeOrmModule.forFeature([BusinessEntity, BusinessThemeEntity]),
    FileUploadModule,
    BaseUsersModule,
  ],
  providers: [
    BaseBusinessService,
    BaseBusinessThemeService,
    PlatformBusinessSeed,
  ],
  exports: [
    BaseBusinessService,
    BaseBusinessThemeService,
    TypeOrmModule,
  ],
})
export class BaseBusinessModule {}
