import {
  EDayOfWeek,
  EScheduleFrequency,
} from "@template/contracts";

/** Frequency inputs for ScheduleUtils.generateCronExpression. */
export type FrequencyConfig = {
  frequency: EScheduleFrequency;
  weekDays?: EDayOfWeek[];
  monthDays?: number[];
  months?: number[];
};
