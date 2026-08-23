import type { z } from "zod";
import {
  businessListQuerySchema,
  businessSchema,
  businessThemeSchema,
  createBusinessSchema,
  upsertBusinessThemeSchema,
} from "./schema.js";

export type TCreateBusinessData = z.infer<typeof createBusinessSchema>;
export type TBusinessListQuery = z.infer<typeof businessListQuerySchema>;
export interface IBusiness extends z.infer<typeof businessSchema> {}
export interface IBusinessTheme extends z.infer<typeof businessThemeSchema> {}
export type TUpsertBusinessThemeData = z.infer<typeof upsertBusinessThemeSchema>;
