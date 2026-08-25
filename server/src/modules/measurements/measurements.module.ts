import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { PermissionsModule } from "../../common/base";
import { GarmentTypesModule } from "../garment-types/garment-types.module";
import { MeasurementEntity } from "./entities/measurement.entity";
import { MeasurementsService } from "./measurements.service";

@Module({
  imports: [
    TypeOrmModule.forFeature([MeasurementEntity]),
    PermissionsModule,
    GarmentTypesModule,
  ],
  providers: [MeasurementsService],
  exports: [MeasurementsService],
})
export class MeasurementsModule {}
