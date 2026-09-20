import { z } from "zod";

/** One metric tile on the example dashboard. */
export const dashboardStatSchema = z.object({
  key: z.string(),
  label: z.string(),
  value: z.number(),
  hint: z.string().optional(),
  /**
   * Numbers the client substitutes into its own translation of `hint`, so the
   * card reads in the user's language instead of the server's English.
   */
  hintParams: z.record(z.union([z.string(), z.number()])).optional(),
  /** Set for money stats (e.g. "PKR") so the client shows the currency. */
  currency: z.string().optional(),
  /** Colour for the whole card: green (success) or red (danger). */
  tone: z.enum(["default", "success", "danger"]).optional(),
  /** Optional second line, e.g. "Revenue PKR 120,000". */
  subLabel: z.string().optional(),
  subValue: z.number().optional(),
  subCurrency: z.string().optional(),
  subTone: z.enum(["default", "success", "danger"]).optional(),
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
