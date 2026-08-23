import { Module } from "@nestjs/common";
import { PermissionsModule } from "../../common/base";
import { AiProcessorsModule } from "../../common/ai-processors";
import { AiAdapterController } from "./ai-adapter.controller";
import { AiAdapterService } from "./ai-adapter.service";

@Module({
  imports: [PermissionsModule, AiProcessorsModule],
  controllers: [AiAdapterController],
  providers: [AiAdapterService],
  exports: [AiAdapterService],
})
export class AiAdapterModule {}
