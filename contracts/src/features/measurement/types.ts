import type { z } from "zod";
import {
  measurementValuesSchema,
  updateMeasurementSchema,
} from "./schema.js";

export type TMeasurementValues = z.infer<typeof measurementValuesSchema>;
export type TUpdateMeasurementData = z.infer<typeof updateMeasurementSchema>;
