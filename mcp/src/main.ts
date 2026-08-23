import "./load-env";
import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { ConfigService } from "@nestjs/config";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { AppModule } from "./app.module";
import type { McpConfig } from "./config";
import { McpRegistryService } from "./modules/transport";

async function bootstrap() {
  const isStdio = process.argv.includes("--stdio");

  if (isStdio) {
    const app = await NestFactory.createApplicationContext(AppModule);
    const registry = app.get(McpRegistryService);
    const transport = new StdioServerTransport();
    await registry.server.connect(transport);
    console.error("MCP server running on stdio");
    return;
  }

  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);
  const mcp = config.getOrThrow<McpConfig>("mcp");
  await app.listen(mcp.port);
  console.log(`MCP server http://localhost:${mcp.port}/mcp`);
}

bootstrap();
