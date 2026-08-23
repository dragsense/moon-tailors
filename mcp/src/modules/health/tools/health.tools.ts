import { Injectable } from "@nestjs/common";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ApiClientError } from "../../../common/api";
import { jsonResult, textResult, type McpRegistrar } from "../../../common/mcp";
import { HealthApiService } from "../api/health.service";

@Injectable()
export class HealthTools implements McpRegistrar {
  constructor(private readonly health: HealthApiService) {}

  register(server: McpServer) {
    server.registerTool(
      "api_health",
      {
        description:
          "Call Nest GET /health and return status (uses MCP_API_BASE_URL)",
      },
      async () => {
        try {
          const data = await this.health.check();
          return jsonResult(data);
        } catch (err) {
          if (err instanceof ApiClientError) {
            return textResult(
              `API health failed (${err.status}): ${err.message}`,
            );
          }
          throw err;
        }
      },
    );
  }
}
