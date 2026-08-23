import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { McpConfig } from "../../../config";
import type { McpRegistrar } from "../../../common/mcp";

@Injectable()
export class PlatformResources implements McpRegistrar {
  private readonly startedAt = Date.now();

  constructor(private readonly config: ConfigService) {}

  register(server: McpServer) {
    const mcp = this.config.getOrThrow<McpConfig>("mcp");

    server.resource("info", "template://info", async () => ({
      contents: [
        {
          uri: "template://info",
          mimeType: "application/json",
          text: JSON.stringify(
            {
              name: mcp.name,
              version: mcp.version,
              apiBaseUrl: mcp.apiBaseUrl,
              description:
                "Template MCP — tools call Nest via common/api BaseApiService",
            },
            null,
            2,
          ),
        },
      ],
    }));

    server.resource("status", "template://status", async () => {
      const uptimeSec = Math.floor((Date.now() - this.startedAt) / 1000);
      return {
        contents: [
          {
            uri: "template://status",
            mimeType: "application/json",
            text: JSON.stringify(
              {
                status: "healthy",
                uptime_seconds: uptimeSec,
                node_version: process.version,
                memory_mb: Math.round(
                  process.memoryUsage().heapUsed / 1024 / 1024,
                ),
              },
              null,
              2,
            ),
          },
        ],
      };
    });
  }
}
