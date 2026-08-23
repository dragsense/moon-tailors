import { z } from "zod";
import { listQuerySchema } from "../../common/schema.js";
import { field } from "../../lib/field-meta.js";
import {
  EDayOfWeek,
  EIntervalUnit,
  EScheduleFrequency,
  EScheduleStatus,
} from "./enum.js";

const dateInput = z.union([z.string().min(1), z.coerce.date()]);

export const createScheduleSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  entityId: z.string().uuid().optional(),
  action: z.string().min(1),
  data: z.record(z.unknown()).optional(),
  frequency: z.nativeEnum(EScheduleFrequency).optional(),
  startDate: dateInput.optional(),
  endDate: dateInput.optional(),
  timeOfDay: z
    .string()
    .regex(/^\d{2}:\d{2}$/)
    .optional(),
  endTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/)
    .optional(),
  intervalValue: z.number().int().positive().optional(),
  intervalUnit: z.nativeEnum(EIntervalUnit).optional(),
  interval: z.number().int().positive().optional(),
  timezone: z.string().optional(),
  weekDays: z.array(z.nativeEnum(EDayOfWeek)).optional(),
  monthDays: z.array(z.number().int().min(1).max(31)).optional(),
  months: z.array(z.number().int().min(1).max(12)).optional(),
  nextRunDate: dateInput.optional(),
  retryOnFailure: z.boolean().optional(),
  maxRetries: z.number().int().min(0).optional(),
  retryDelayMinutes: z.number().int().min(0).optional(),
});

export const updateScheduleSchema = createScheduleSchema.partial().extend({
  status: z.nativeEnum(EScheduleStatus).optional(),
});

/** GET /schedules query */
export const scheduleListQuerySchema = listQuerySchema.extend({
  status: field(z.nativeEnum(EScheduleStatus).optional(), {
    type: "select",
    label: "Status",
    placeholder: "All statuses",
    order: 2,
    filter: "eq",
    options: [
      { label: "Any", value: "__any__" },
      { label: "Active", value: EScheduleStatus.ACTIVE },
      { label: "Paused", value: EScheduleStatus.PAUSED },
      { label: "Completed", value: EScheduleStatus.COMPLETED },
      { label: "Failed", value: EScheduleStatus.FAILED },
      { label: "Cancelled", value: EScheduleStatus.CANCELLED },
    ],
  }),
});

export const scheduleSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  description: z.string().optional(),
  entityId: z.string().uuid().optional(),
  action: z.string(),
  data: z.record(z.unknown()).optional(),
  frequency: z.nativeEnum(EScheduleFrequency),
  startDate: z.string(),
  endDate: z.string().optional(),
  timeOfDay: z.string().optional(),
  endTime: z.string().optional(),
  intervalValue: z.number().optional(),
  intervalUnit: z.nativeEnum(EIntervalUnit).optional(),
  interval: z.number().optional(),
  timezone: z.string().optional(),
  weekDays: z.array(z.nativeEnum(EDayOfWeek)).optional(),
  monthDays: z.array(z.number()).optional(),
  months: z.array(z.number()).optional(),
  status: z.nativeEnum(EScheduleStatus),
  cronExpression: z.string().nullable().optional(),
  nextRunDate: z.string(),
  lastRunAt: z.string().nullable().optional(),
  executionCount: z.number(),
  successCount: z.number(),
  failureCount: z.number(),
  retryOnFailure: z.boolean().optional(),
  maxRetries: z.number().optional(),
  retryDelayMinutes: z.number().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
