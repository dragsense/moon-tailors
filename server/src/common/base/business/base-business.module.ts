import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { FileUploadModule } from "../../file-upload";
import { BaseUsersModule } from "../users";
import { BusinessEntity } from "./entities";
import { BaseBusinessService } from "./base-business.service";
import { PlatformBusinessSeed } from "./seeder/platform-business.seed";

@Module({
  imports: [
    TypeOrmModule.forFeature([BusinessEntity]),
    FileUploadModule,
    BaseUsersModule,
  ],
  providers: [
    BaseBusinessService,
    PlatformBusinessSeed,
  ],
  exports: [
    BaseBusinessService,
    TypeOrmModule,
  ],
})
export class BaseBusinessModule {}
