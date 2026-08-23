import { z } from "zod";
import { field } from "../../lib/field-meta.js";

const timeHm = z
  .string()
  .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Use HH:mm");

export const timeSlotSchema = z.object({
  start: field(timeHm, { type: "text", label: "Start", order: 1 }),
  end: field(timeHm, { type: "text", label: "End", order: 2 }),
});

export const dayScheduleSchema = z.object({
  enabled: field(z.boolean().default(false), {
    type: "switch",
    label: "Enabled",
    order: 1,
  }),
  timeSlots: z.array(timeSlotSchema).max(5).default([]),
});

export const weeklyScheduleSchema = z.object({
  monday: dayScheduleSchema.default({ enabled: false, timeSlots: [] }),
  tuesday: dayScheduleSchema.default({ enabled: false, timeSlots: [] }),
  wednesday: dayScheduleSchema.default({ enabled: false, timeSlots: [] }),
  thursday: dayScheduleSchema.default({ enabled: false, timeSlots: [] }),
  friday: dayScheduleSchema.default({ enabled: false, timeSlots: [] }),
  saturday: dayScheduleSchema.default({ enabled: false, timeSlots: [] }),
  sunday: dayScheduleSchema.default({ enabled: false, timeSlots: [] }),
});

export const unavailablePeriodSchema = z.object({
  reason: field(z.string().max(200).optional(), {
    type: "text",
    label: "Reason",
    order: 1,
  }),
  startDate: field(z.string().optional(), {
    type: "date",
    label: "From",
    order: 2,
  }),
  endDate: field(z.string().optional(), {
    type: "date",
    label: "To",
    order: 3,
  }),
});

/** Upsert body — one form for create + update. */
export const upsertUserAvailabilitySchema = z.object({
  weeklySchedule: weeklyScheduleSchema,
  unavailablePeriods: z.array(unavailablePeriodSchema).max(10).default([]),
});

export const userAvailabilitySchema = upsertUserAvailabilitySchema.extend({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const WEEKDAY_KEYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const;

export type TWeekday = (typeof WEEKDAY_KEYS)[number];
