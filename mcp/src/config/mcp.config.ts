import { registerAs } from "@nestjs/config";

export type McpConfig = {
  port: number;
  /** Nest API base including `/api` (e.g. http://localhost:3000/api). */
  apiBaseUrl: string;
  /** Optional API key for authenticated tools (`x-api-key`). */
  apiKey?: string;
  name: string;
  version: string;
};

export default registerAs(
  "mcp",
  (): McpConfig => ({
    port: Number(process.env.MCP_PORT ?? 4000),
    apiBaseUrl:
      process.env.MCP_API_BASE_URL ?? "http://localhost:3000/api",
    apiKey: process.env.MCP_API_KEY || undefined,
    name: process.env.MCP_SERVER_NAME ?? "moon-tailors-mcp",
    version: process.env.MCP_SERVER_VERSION ?? "0.1.0",
  }),
);
