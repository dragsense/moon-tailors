import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { PermissionsModule } from "../../common/base";
import { GarmentTypesModule } from "../garment-types/garment-types.module";
import { MeasurementsModule } from "../measurements/measurements.module";
import { CustomersController } from "./customers.controller";
import { CustomersService } from "./customers.service";
import { CustomerEntity } from "./entities/customer.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([CustomerEntity]),
    PermissionsModule,
    MeasurementsModule,
    GarmentTypesModule,
  ],
  controllers: [CustomersController],
  providers: [CustomersService],
  exports: [CustomersService],
})
export class CustomersModule {}
