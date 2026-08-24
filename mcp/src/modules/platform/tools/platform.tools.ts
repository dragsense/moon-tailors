import { Injectable } from "@nestjs/common";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { jsonResult, textResult, type McpRegistrar } from "../../../common/mcp";

/** Demo / platform tools — replace or extend with real domain tools. */
@Injectable()
export class PlatformTools implements McpRegistrar {
  register(server: McpServer) {
    server.registerTool(
      "hello",
      { description: "Say hello to the Moon Tailors MCP server" },
      async () => textResult("Hello from Moon Tailors MCP server!"),
    );

    // `as any` on config: MCP SDK + Zod can OOM TypeScript in nest --watch (TS2589).
    server.registerTool(
      "echo",
      {
        description: "Echo back the provided message",
        inputSchema: {
          message: z.string().describe("The message to echo back"),
        },
      } as any,
      async (args: any) => textResult(String(args?.message ?? "")),
    );

    server.registerTool(
      "server_info",
      { description: "Return MCP server metadata as JSON" },
      async () =>
        jsonResult({
          name: "moon-tailors-mcp",
          role: "Agent surface over the Nest API",
          structure: "modules/{platform,health,tasks} + common/api",
        }),
    );
  }
}
