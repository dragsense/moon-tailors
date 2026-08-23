import { Module, forwardRef } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { PermissionsModule } from "../../common/base";
import { CamerasController } from "./cameras.controller";
import { CamerasService } from "./cameras.service";
import { CameraEntity } from "./entities/camera.entity";
import { StreamsModule } from "./streams/streams.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([CameraEntity]),
    PermissionsModule,
    forwardRef(() => StreamsModule),
  ],
  controllers: [CamerasController],
  providers: [CamerasService],
  exports: [CamerasService],
})
export class CamerasModule {}
