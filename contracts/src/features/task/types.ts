import type { z } from "zod";
import {
  createTaskSchema,
  deleteManyTasksSchema,
  taskListQuerySchema,
  updateTaskSchema,
  updateTaskStatusSchema,
} from "./schema.js";

/** Request payload / query aliases. */
export type TCreateTaskData = z.infer<typeof createTaskSchema>;
export type TUpdateTaskData = z.infer<typeof updateTaskSchema>;
export type TUpdateTaskStatusData = z.infer<typeof updateTaskStatusSchema>;
export type TTaskListQuery = z.infer<typeof taskListQuerySchema>;
export type TDeleteManyTasksData = z.infer<typeof deleteManyTasksSchema>;
