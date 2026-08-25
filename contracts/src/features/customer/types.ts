import type { z } from "zod";
import {
  copyCustomerMeasurementSchema,
  createCustomerSchema,
  customerListQuerySchema,
  measurementInputSchema,
  measurementValuesSchema,
  updateCustomerSchema,
  updateMeasurementSchema,
} from "./schema.js";

export type TCreateCustomerData = z.infer<typeof createCustomerSchema>;
export type TUpdateCustomerData = z.infer<typeof updateCustomerSchema>;
export type TCustomerListQuery = z.infer<typeof customerListQuerySchema>;
export type TMeasurementValues = z.infer<typeof measurementValuesSchema>;
export type TUpdateMeasurementData = z.infer<typeof updateMeasurementSchema>;
export type TMeasurementInput = z.infer<typeof measurementInputSchema>;
export type TCopyCustomerMeasurementData = z.infer<
  typeof copyCustomerMeasurementSchema
>;
