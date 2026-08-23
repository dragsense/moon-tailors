import { All, Controller, Req, Res } from "@nestjs/common";
import { Request, Response } from "express";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { McpRegistryService } from "./mcp-registry.service";

@Controller("mcp")
export class McpController {
  constructor(private readonly registry: McpRegistryService) {}

  @All()
  async handle(@Req() req: Request, @Res() res: Response) {
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
    });
    await this.registry.server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  }
}
