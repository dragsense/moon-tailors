import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { PermissionsModule } from "../../common/base";
import { UserAvailabilityEntity } from "./entities/user-availability.entity";
import { UserAvailabilityController } from "./user-availability.controller";
import { UserAvailabilityService } from "./user-availability.service";

@Module({
  imports: [
    TypeOrmModule.forFeature([UserAvailabilityEntity]),
    PermissionsModule,
  ],
  controllers: [UserAvailabilityController],
  providers: [UserAvailabilityService],
  exports: [UserAvailabilityService],
})
export class UserAvailabilityModule {}
