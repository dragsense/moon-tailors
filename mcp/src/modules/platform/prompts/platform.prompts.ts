import { Injectable } from "@nestjs/common";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { McpRegistrar } from "../../../common/mcp";

@Injectable()
export class PlatformPrompts implements McpRegistrar {
  register(server: McpServer) {
    server.registerPrompt(
      "summarize",
      {
        description: "Generate a concise summary of the provided text",
        argsSchema: {
          text: z.string().describe("The text to summarize"),
        },
      } as any,
      (args: any) => ({
        messages: [
          {
            role: "user" as const,
            content: {
              type: "text" as const,
              text: `Please provide a concise summary of the following text:\n\n${String(args?.text ?? "")}`,
            },
          },
        ],
      }),
    );
  }
}
