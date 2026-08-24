import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { PermissionsModule } from "../../common/base";
import { MeasurementEntity } from "./entities/measurement.entity";
import { MeasurementsService } from "./measurements.service";

@Module({
  imports: [
    TypeOrmModule.forFeature([MeasurementEntity]),
    PermissionsModule,
  ],
  providers: [MeasurementsService],
  exports: [MeasurementsService],
})
export class MeasurementsModule {}
