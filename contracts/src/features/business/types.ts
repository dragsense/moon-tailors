import type { z } from "zod";
import {
  businessListQuerySchema,
  businessSchema,
  createBusinessSchema,
} from "./schema.js";

export type TCreateBusinessData = z.infer<typeof createBusinessSchema>;
export type TBusinessListQuery = z.infer<typeof businessListQuerySchema>;
export interface IBusiness extends z.infer<typeof businessSchema> {}
