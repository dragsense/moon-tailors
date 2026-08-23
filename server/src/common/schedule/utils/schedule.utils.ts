import { CronExpressionParser } from "cron-parser";
import { DateTime } from "luxon";
import { EScheduleFrequency } from "@template/contracts";
import type { FrequencyConfig } from "../types";

export class ScheduleUtils {
  static generateCronExpression(
    frequencyConfig: FrequencyConfig,
    timeOfDay = "00:00",
    intervalMinutes = 0,
  ): string {
    let [hours, minutes] = timeOfDay.split(":").map(Number);
    if (
      Number.isNaN(hours) ||
      Number.isNaN(minutes) ||
      hours < 0 ||
      hours > 23 ||
      minutes < 0 ||
      minutes > 59
    ) {
      throw new Error(
        `Invalid timeOfDay format: ${timeOfDay}. Expected HH:MM.`,
      );
    }

    if (intervalMinutes > 0) {
      const total = hours * 60 + minutes + intervalMinutes;
      hours = Math.floor((total % (24 * 60)) / 60);
      minutes = total % 60;
    }

    let cronExpression: string;
    switch (frequencyConfig.frequency) {
      case EScheduleFrequency.DAILY:
        cronExpression = `${minutes} ${hours} * * *`;
        break;
      case EScheduleFrequency.WEEKLY: {
        const days = frequencyConfig.weekDays?.join(",") || "*";
        cronExpression = `${minutes} ${hours} * * ${days}`;
        break;
      }
      case EScheduleFrequency.MONTHLY: {
        const dates = frequencyConfig.monthDays?.join(",") || "1";
        cronExpression = `${minutes} ${hours} ${dates} * *`;
        break;
      }
      case EScheduleFrequency.YEARLY: {
        const yearDates = frequencyConfig.monthDays?.join(",") || "1";
        const yearMonths =
          frequencyConfig.months?.map((m) => m - 1).join(",") || "0";
        cronExpression = `${minutes} ${hours} ${yearDates} ${yearMonths} *`;
        break;
      }
      case EScheduleFrequency.ONCE:
        cronExpression = `${minutes} ${hours} * * *`;
        break;
      default:
        throw new Error(
          `Unsupported frequency: ${frequencyConfig.frequency as string}`,
        );
    }

    const parts = cronExpression.trim().split(/\s+/);
    if (parts.length !== 5) {
      throw new Error(`Invalid cron expression: ${cronExpression}`);
    }
    return cronExpression;
  }

  static calculateNextRun(
    cronExpression: string,
    startDate: Date,
    endDate: Date | null,
    timezone = "UTC",
  ): { nextRunAt: Date; isActive: boolean } {
    const now = DateTime.now().setZone(timezone);
    const start = DateTime.fromJSDate(startDate).setZone(timezone);
    const end = endDate
      ? DateTime.fromJSDate(endDate).setZone(timezone)
      : null;

    const interval = CronExpressionParser.parse(cronExpression, {
      currentDate: (start > now ? start : now).toJSDate(),
      tz: timezone,
    });
    const nextDate = DateTime.fromJSDate(interval.next().toDate()).setZone(
      timezone,
    );

    if (end && nextDate > end) {
      return { nextRunAt: nextDate.toJSDate(), isActive: false };
    }
    return { nextRunAt: nextDate.toJSDate(), isActive: true };
  }

  static getNextRunDate(
    cronExpression: string,
    currentDate: Date,
    timezone = "UTC",
  ): Date {
    const interval = CronExpressionParser.parse(cronExpression, {
      currentDate,
      tz: timezone,
    });
    return interval.next().toDate();
  }
}
