import { Module } from "@nestjs/common";
import {
  BaseBusinessModule,
  BaseUsersModule,
  PermissionsModule,
} from "../../common/base";
import { BusinessController } from "./business.controller";
import { BusinessService } from "./business.service";

@Module({
  imports: [
    BaseBusinessModule,
    BaseUsersModule,
    PermissionsModule,
  ],
  controllers: [BusinessController],
  providers: [BusinessService],
  exports: [BusinessService],
})
export class BusinessModule {}
