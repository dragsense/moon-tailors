import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { PermissionsModule } from "../../common/base";
import { StaffPaymentEntity } from "./entities/staff-payment.entity";
import { StaffEntity } from "./entities/staff.entity";
import { StaffSlipService } from "./staff-slip.service";
import { StaffController } from "./staff.controller";
import { StaffService } from "./staff.service";

@Module({
  imports: [
    TypeOrmModule.forFeature([StaffEntity, StaffPaymentEntity]),
    PermissionsModule,
  ],
  controllers: [StaffController],
  providers: [StaffService, StaffSlipService],
  exports: [StaffService],
})
export class StaffModule {}
