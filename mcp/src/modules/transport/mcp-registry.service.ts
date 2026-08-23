import { Injectable, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { McpConfig } from "../../config";
import type { McpRegistrar } from "../../common/mcp";
import {
  PlatformPrompts,
  PlatformResources,
  PlatformTools,
} from "../platform";
import { HealthTools } from "../health";
import { TasksTools } from "../tasks";

/**
 * Owns the MCP server instance and wires every feature registrar
 * (same role as Nest app bootstrap for HTTP modules).
 */
@Injectable()
export class McpRegistryService implements OnModuleInit {
  readonly server: McpServer;

  constructor(
    config: ConfigService,
    private readonly platformTools: PlatformTools,
    private readonly platformResources: PlatformResources,
    private readonly platformPrompts: PlatformPrompts,
    private readonly healthTools: HealthTools,
    private readonly tasksTools: TasksTools,
  ) {
    const mcp = config.getOrThrow<McpConfig>("mcp");
    this.server = new McpServer({
      name: mcp.name,
      version: mcp.version,
    });
  }

  onModuleInit() {
    const registrars: McpRegistrar[] = [
      this.platformTools,
      this.platformResources,
      this.platformPrompts,
      this.healthTools,
      this.tasksTools,
    ];
    for (const registrar of registrars) {
      registrar.register(this.server);
    }
  }
}
