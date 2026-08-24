import { Module } from "@nestjs/common";
import {
  BaseBusinessModule,
  PermissionsModule,
} from "../../common/base";
import { UsersModule } from "../users/users.module";
import { BusinessController } from "./business.controller";
import { BusinessService } from "./business.service";
import { PlatformBusinessSeed } from "./seeder/platform-business.seed";

@Module({
  imports: [
    BaseBusinessModule,
    UsersModule,
    PermissionsModule,
  ],
  controllers: [BusinessController],
  providers: [BusinessService, PlatformBusinessSeed],
  exports: [BusinessService],
})
export class BusinessModule {}
