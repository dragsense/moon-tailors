import { registerAs } from "@nestjs/config";

export type ActivityLogsConfig = {
  /** Global kill switch — when false, no activity is written. */
  enabled: boolean;
};

export default registerAs(
  "activityLogs",
  (): ActivityLogsConfig => ({
    enabled: process.env.ACTIVITY_LOGS_ENABLED === "true",
  }),
);
