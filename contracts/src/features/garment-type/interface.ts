import type { z } from "zod";
import {
  garmentTypeSchema,
  paginatedGarmentTypesSchema,
} from "./schema.js";

export interface IGarmentType extends z.infer<typeof garmentTypeSchema> {}

export interface IPaginatedGarmentTypes
  extends z.infer<typeof paginatedGarmentTypesSchema> {}
