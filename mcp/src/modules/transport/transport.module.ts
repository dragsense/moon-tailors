import { Module } from "@nestjs/common";
import { PlatformModule } from "../platform";
import { HealthModule } from "../health";
import { TasksModule } from "../tasks";
import { McpController } from "./mcp.controller";
import { McpRegistryService } from "./mcp-registry.service";

@Module({
  imports: [PlatformModule, HealthModule, TasksModule],
  controllers: [McpController],
  providers: [McpRegistryService],
  exports: [McpRegistryService],
})
export class TransportModule {}
