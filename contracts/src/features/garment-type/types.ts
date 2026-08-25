import type { z } from "zod";
import {
  createGarmentTypeSchema,
  garmentTypeListQuerySchema,
  updateGarmentTypeSchema,
} from "./schema.js";

export type TCreateGarmentTypeData = z.infer<typeof createGarmentTypeSchema>;
export type TUpdateGarmentTypeData = z.infer<typeof updateGarmentTypeSchema>;
export type TGarmentTypeListQuery = z.infer<typeof garmentTypeListQuerySchema>;
