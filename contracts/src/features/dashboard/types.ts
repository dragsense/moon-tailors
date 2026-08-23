import type { z } from "zod";
import {
  dashboardActivitySchema,
  dashboardStatSchema,
  dashboardSummarySchema,
} from "./schema.js";

export type TDashboardStat = z.infer<typeof dashboardStatSchema>;
export type TDashboardActivity = z.infer<typeof dashboardActivitySchema>;
export type TDashboardSummary = z.infer<typeof dashboardSummarySchema>;
