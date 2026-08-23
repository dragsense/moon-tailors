import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import type {
  IMessageResponse,
  IPaginatedResponse,
  TCreateTaskData,
  TDeleteManyTasksData,
  TTaskListQuery,
  TUpdateTaskData,
} from "@template/contracts";
import {
  createTaskSchema,
  deleteManyTasksSchema,
  EPermissionAction,
  EResource,
  taskListQuerySchema,
  updateTaskSchema,
} from "@template/contracts";
import { ZodValidationPipe } from "../../common/validation";
import { RequirePermissions } from "../../common/auth";
import { TaskEntity } from "./entities/task.entity";
import { TasksService } from "./tasks.service";

@ApiTags("Tasks")
@Controller("tasks")
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  @RequirePermissions({
    resource: EResource.TASKS,
    action: EPermissionAction.CREATE,
  })
  create(
    @Body(new ZodValidationPipe(createTaskSchema)) body: TCreateTaskData,
  ): Promise<IMessageResponse> {
    return this.tasksService.create(body);
  }

  @Get()
  @RequirePermissions({
    resource: EResource.TASKS,
    action: EPermissionAction.READ,
  })
  list(
    @Query(new ZodValidationPipe(taskListQuerySchema)) query: TTaskListQuery,
  ): Promise<IPaginatedResponse<TaskEntity>> {
    return this.tasksService.list(query);
  }

  @Post("bulk-delete")
  @RequirePermissions({
    resource: EResource.TASKS,
    action: EPermissionAction.DELETE,
  })
  removeMany(
    @Body(new ZodValidationPipe(deleteManyTasksSchema))
    body: TDeleteManyTasksData,
  ): Promise<IMessageResponse> {
    return this.tasksService.removeMany(body.ids);
  }

  @Get(":id")
  @RequirePermissions({
    resource: EResource.TASKS,
    action: EPermissionAction.READ,
  })
  get(@Param("id") id: string): Promise<TaskEntity> {
    return this.tasksService.get(id);
  }

  @Patch(":id")
  @RequirePermissions({
    resource: EResource.TASKS,
    action: EPermissionAction.UPDATE,
  })
  update(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(updateTaskSchema)) body: TUpdateTaskData,
  ): Promise<IMessageResponse> {
    return this.tasksService.update(id, body);
  }

  @Delete(":id")
  @RequirePermissions({
    resource: EResource.TASKS,
    action: EPermissionAction.DELETE,
  })
  remove(@Param("id") id: string): Promise<IMessageResponse> {
    return this.tasksService.remove(id);
  }
}
