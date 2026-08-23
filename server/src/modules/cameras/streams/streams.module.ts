import { Module, forwardRef } from "@nestjs/common";
import { CamerasModule } from "../cameras.module";
import { MediaMtxApiService } from "./services/mediamtx-api.service";
import { StreamPathCleanupService } from "./services/stream-path-cleanup.service";
import { StreamsController } from "./streams.controller";
import { StreamsService } from "./streams.service";

@Module({
  imports: [forwardRef(() => CamerasModule)],
  controllers: [StreamsController],
  providers: [StreamsService, MediaMtxApiService, StreamPathCleanupService],
  exports: [StreamsService],
})
export class StreamsModule {}
