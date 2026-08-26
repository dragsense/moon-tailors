import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { PermissionsModule } from "../../common/base";
import { CustomerEntity } from "../customers/entities/customer.entity";
import { OrderEntity } from "../orders/entities/order.entity";
import { MeasurementEntity } from "./entities/measurement.entity";
import { MeasurementsController } from "./measurements.controller";
import { MeasurementsService } from "./measurements.service";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      MeasurementEntity,
      CustomerEntity,
      OrderEntity,
    ]),
    PermissionsModule,
  ],
  controllers: [MeasurementsController],
  providers: [MeasurementsService],
  exports: [MeasurementsService],
})
export class MeasurementsModule {}
