import { Module } from "@nestjs/common";
import { HealthApiService } from "./api/health.service";
import { HealthTools } from "./tools/health.tools";

@Module({
  providers: [HealthApiService, HealthTools],
  exports: [HealthTools],
})
export class HealthModule {}
