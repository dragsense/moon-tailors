import type { z } from "zod";
import {
  dashboardActivitySchema,
  dashboardStatSchema,
  dashboardSummarySchema,
} from "./schema.js";

export interface IDashboardStat extends z.infer<typeof dashboardStatSchema> {}
export interface IDashboardActivity
  extends z.infer<typeof dashboardActivitySchema> {}
export interface IDashboardSummary
  extends z.infer<typeof dashboardSummarySchema> {}
