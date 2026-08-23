import { z } from "zod";

/** One metric tile on the example dashboard. */
export const dashboardStatSchema = z.object({
  key: z.string(),
  label: z.string(),
  value: z.number(),
  hint: z.string().optional(),
});

/** Lightweight activity row (example feed). */
export const dashboardActivitySchema = z.object({
  id: z.string(),
  title: z.string(),
  detail: z.string().optional(),
  at: z.string().datetime(),
});

/** GET /dashboard — example summary payload. */
export const dashboardSummarySchema = z.object({
  stats: z.array(dashboardStatSchema),
  activity: z.array(dashboardActivitySchema),
  generatedAt: z.string().datetime(),
});
