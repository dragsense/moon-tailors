export enum EScheduleStatus {
  ACTIVE = "active",
  PAUSED = "paused",
  COMPLETED = "completed",
  FAILED = "failed",
  CANCELLED = "cancelled",
}

export enum EScheduleFrequency {
  ONCE = "once",
  DAILY = "daily",
  WEEKLY = "weekly",
  MONTHLY = "monthly",
  YEARLY = "yearly",
}

export enum EDayOfWeek {
  SUNDAY = 0,
  MONDAY = 1,
  TUESDAY = 2,
  WEDNESDAY = 3,
  THURSDAY = 4,
  FRIDAY = 5,
  SATURDAY = 6,
}

export enum EIntervalUnit {
  MINUTES = "minutes",
  HOURS = "hours",
}
