import type { z } from "zod";
import type { IMessageResponse } from "../../common/interface.js";
import {
  paginatedTasksSchema,
  taskAssigneeSchema,
  taskSchema,
} from "./schema.js";

/** Response / entity interfaces. */
export interface ITaskAssignee extends z.infer<typeof taskAssigneeSchema> {}

export interface ITask extends z.infer<typeof taskSchema> {}

export interface IPaginatedTasks
  extends z.infer<typeof paginatedTasksSchema> {}

export type TTaskResponse = { task: ITask } & IMessageResponse;
