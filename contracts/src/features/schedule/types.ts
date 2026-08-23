import type { z } from "zod";
import {
  createScheduleSchema,
  scheduleListQuerySchema,
  scheduleSchema,
  updateScheduleSchema,
} from "./schema.js";

export type TCreateScheduleData = z.infer<typeof createScheduleSchema>;
export type TUpdateScheduleData = z.infer<typeof updateScheduleSchema>;
export type TScheduleListQuery = z.infer<typeof scheduleListQuerySchema>;
export interface ISchedule extends z.infer<typeof scheduleSchema> {}
