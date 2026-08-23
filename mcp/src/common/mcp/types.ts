import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

/** Feature modules implement this to register tools / resources / prompts. */
export interface McpRegistrar {
  register(server: McpServer): void;
}

export const MCP_REGISTRARS = Symbol("MCP_REGISTRARS");
