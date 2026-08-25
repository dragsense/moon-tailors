import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { PermissionsModule } from "../../common/base";
import { GarmentTypeEntity } from "./entities/garment-type.entity";
import { GarmentTypesController } from "./garment-types.controller";
import { GarmentTypesService } from "./garment-types.service";
import { SystemGarmentTypesSeed } from "./seeder/system-garment-types.seed";

@Module({
  imports: [
    TypeOrmModule.forFeature([GarmentTypeEntity]),
    PermissionsModule,
  ],
  controllers: [GarmentTypesController],
  providers: [GarmentTypesService, SystemGarmentTypesSeed],
  exports: [GarmentTypesService],
})
export class GarmentTypesModule {}
