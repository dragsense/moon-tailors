import { Injectable } from "@nestjs/common";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ApiClientError } from "../../../common/api";
import { jsonResult, textResult, type McpRegistrar } from "../../../common/mcp";
import { TasksApiService } from "../api/tasks.service";

@Injectable()
export class TasksTools implements McpRegistrar {
  constructor(private readonly tasks: TasksApiService) {}

  register(server: McpServer) {
    server.registerTool(
      "tasks_list",
      {
        description:
          "List tasks from the Nest API (requires MCP_API_KEY with tasks:read)",
        inputSchema: {
          page: z.number().int().positive().optional().describe("Page number"),
          limit: z
            .number()
            .int()
            .positive()
            .max(100)
            .optional()
            .describe("Page size"),
          search: z.string().optional().describe("Search string"),
        },
      } as any,
      async (args: any) => {
        try {
          const data = await this.tasks.list(args ?? {});
          return jsonResult(data);
        } catch (err) {
          if (err instanceof ApiClientError) {
            return textResult(
              `tasks_list failed (${err.status}): ${err.message}. Set MCP_API_KEY if the route is protected.`,
            );
          }
          throw err;
        }
      },
    );

    server.registerTool(
      "tasks_get",
      {
        description: "Get one task by id from the Nest API",
        inputSchema: {
          id: z.string().uuid().describe("Task id"),
        },
      } as any,
      async (args: any) => {
        try {
          const data = await this.tasks.getOne(String(args?.id ?? ""));
          return jsonResult(data);
        } catch (err) {
          if (err instanceof ApiClientError) {
            return textResult(
              `tasks_get failed (${err.status}): ${err.message}`,
            );
          }
          throw err;
        }
      },
    );
  }
}
