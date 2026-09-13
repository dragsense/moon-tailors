import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { PermissionsModule } from "../../common/base";
import { StaffEmploymentEntity } from "./entities/staff-employment.entity";
import { StaffEntity } from "./entities/staff.entity";
import { StaffController } from "./staff.controller";
import { StaffService } from "./staff.service";

@Module({
  imports: [
    TypeOrmModule.forFeature([StaffEntity, StaffEmploymentEntity]),
    PermissionsModule,
  ],
  controllers: [StaffController],
  providers: [StaffService],
  exports: [StaffService],
})
export class StaffModule {}
