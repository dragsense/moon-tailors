import type {
  IMessageResponse,
  IPaginatedTasks,
  ITask,
  TCreateTaskData,
  TDeleteManyTasksData,
  TTaskListQuery,
  TUpdateTaskData,
  TUpdateTaskStatusData,
} from "@template/contracts";
import { BaseService } from "~/lib/api";

class TasksService extends BaseService<
  ITask,
  TCreateTaskData,
  TUpdateTaskData
> {
  constructor() {
    super("/tasks");
  }

  list(query: Partial<TTaskListQuery> = {}) {
    const { page = 1, limit = 20, ...rest } = query;
    return this.get<ITask>({ page, limit, ...rest }) as Promise<IPaginatedTasks>;
  }

  getOne(id: string) {
    return this.getSingle(id);
  }

  create(body: TCreateTaskData) {
    return this.post<IMessageResponse>(body);
  }

  update(id: string, body: TUpdateTaskData) {
    return this.patch<IMessageResponse>(id)(body);
  }

  remove(id: string) {
    return this.delete(id) as Promise<IMessageResponse>;
  }

  removeMany(ids: string[]) {
    const body: TDeleteManyTasksData = { ids };
    return this.post<IMessageResponse>(
      body as unknown as TCreateTaskData,
      undefined,
      "/bulk-delete",
    );
  }

  updateStatus(id: string, body: TUpdateTaskStatusData) {
    return this.patch(id)(body);
  }
}

export const tasksService = new TasksService();
