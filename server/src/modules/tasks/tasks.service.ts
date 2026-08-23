import {
  Injectable,
  NotFoundException,
  OnModuleInit,
} from "@nestjs/common";
import type {
  IMessageResponse,
  IPaginatedResponse,
  TCreateTaskData,
  TTaskListQuery,
  TUpdateTaskData,
} from "@template/contracts";
import {
  EResource,
  ETaskStatus,
  filtersFromListSchema,
  taskListQuerySchema,
} from "@template/contracts";
import { ActionRegistryService } from "../../common/actions";
import { ActivityLogRegistry } from "../../common/activity-logs";
import { PermissionsService } from "../../common/base";
import {
  EntityService,
  type IBoundEntityService,
} from "../../common/database";
import { DomainEventRegistry } from "../../common/events";
import type { EntityKey, EntityQueryConfig } from "../../common/query";
import { UsersService } from "../users/users.service";
import { TaskEntity } from "./entities/task.entity";

export const TASK_QUERY: EntityQueryConfig = {
  alias: "task",
  searchable: ["title", "description"],
  sortable: ["createdAt", "updatedAt", "title", "status", "progress"],
  defaultSort: { field: "createdAt", order: "DESC" },
  filters: filtersFromListSchema(taskListQuerySchema),
};

@Injectable()
export class TasksService implements OnModuleInit {
  private readonly entity: IBoundEntityService<TaskEntity>;

  constructor(
    private readonly entityService: EntityService,
    private readonly usersService: UsersService,
    private readonly permissions: PermissionsService,
    private readonly actions: ActionRegistryService,
  ) {
    this.entity = this.entityService.bind(TaskEntity, TASK_QUERY);
  }

  async onModuleInit() {
    await this.permissions.ensureResource(EResource.TASKS);
    ActivityLogRegistry.register({
      module: "tasks",
      endpoints: ["/api/tasks"],
      methods: ["POST", "PUT", "PATCH", "DELETE"],
    });
    DomainEventRegistry.register({
      module: "tasks",
      events: { endpoint: "/api/tasks" },
    });

    this.actions.registerAction("tasks.ping", {
      description: "Example scheduled task handler",
      handler: async (data) => ({
        ok: true,
        taskId: data?.entityId ?? data?.taskId,
        at: new Date().toISOString(),
      }),
    });
  }

  async create(input: TCreateTaskData): Promise<IMessageResponse> {
    if (input.assigneeId) await this.usersService.get(input.assigneeId);

    await this.entity.create({
      title: input.title.trim(),
      description: input.description?.trim() || null,
      status: input.status ?? ETaskStatus.TODO,
      progress: input.progress ?? 0,
      assigneeId: input.assigneeId ?? null,
    });

    return { message: "Task created" };
  }

  list(query: TTaskListQuery): Promise<IPaginatedResponse<TaskEntity>> {
    return this.entity.list(query);
  }

  get(key: EntityKey): Promise<TaskEntity> {
    return this.entity.require(key);
  }

  async update(
    key: EntityKey,
    input: TUpdateTaskData,
  ): Promise<IMessageResponse> {
    if (input.assigneeId) await this.usersService.get(input.assigneeId);

    const patch: Partial<TaskEntity> = {};
    if (input.title !== undefined) patch.title = input.title.trim();
    if (input.description !== undefined) {
      patch.description = input.description?.trim() || null;
    }
    if (input.status !== undefined) patch.status = input.status;
    if (input.progress !== undefined) patch.progress = input.progress;
    if (input.assigneeId !== undefined) {
      patch.assigneeId = input.assigneeId ?? null;
    }

    await this.entity.update(key, patch);
    return { message: "Task updated" };
  }

  async remove(key: EntityKey): Promise<IMessageResponse> {
    await this.entity.softDelete(key);
    return { message: "Task deleted" };
  }

  async removeMany(keys: EntityKey[]): Promise<IMessageResponse> {
    const deleted = await this.entity.softDeleteMany(keys);
    if (deleted === 0) {
      throw new NotFoundException("No tasks found");
    }
    return { message: `${deleted} task${deleted === 1 ? "" : "s"} deleted` };
  }

  async hardDelete(key: EntityKey): Promise<IMessageResponse> {
    await this.entity.hardDelete(key);
    return { message: "Task permanently deleted" };
  }
}
