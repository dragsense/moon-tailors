import { Injectable } from "@nestjs/common";
import type { IPaginatedTasks, ITask } from "@template/contracts";
import { ApiClient, BaseApiService } from "../../../common/api";

/**
 * MCP-side API for Nest `/tasks` — same idea as client `features/tasks/api.ts`.
 */
@Injectable()
export class TasksApiService extends BaseApiService {
  constructor(api: ApiClient) {
    super(api, "/tasks");
  }

  list(query: { page?: number; limit?: number; search?: string } = {}) {
    const { page = 1, limit = 20, ...rest } = query;
    return this.get<IPaginatedTasks>({ page, limit, ...rest });
  }

  getOne(id: string) {
    return this.getSingle<ITask>(id);
  }
}
