import type { z } from "zod";
import {
  upsertUserAvailabilitySchema,
  userAvailabilitySchema,
  timeSlotSchema,
  dayScheduleSchema,
  weeklyScheduleSchema,
  unavailablePeriodSchema,
} from "./schema.js";

export type TTimeSlot = z.infer<typeof timeSlotSchema>;
export type TDaySchedule = z.infer<typeof dayScheduleSchema>;
export type TWeeklySchedule = z.infer<typeof weeklyScheduleSchema>;
export type TUnavailablePeriod = z.infer<typeof unavailablePeriodSchema>;
export type TUpsertUserAvailability = z.infer<typeof upsertUserAvailabilitySchema>;
export type IUserAvailability = z.infer<typeof userAvailabilitySchema>;
