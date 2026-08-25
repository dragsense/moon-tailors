import type { z } from "zod";
import {
  applyMeasurementsToDefaultSchema,
  createOrderSchema,
  orderListQuerySchema,
  updateOrderMeasurementSchema,
  updateOrderSchema,
} from "./schema.js";

export type TCreateOrderData = z.infer<typeof createOrderSchema>;
export type TUpdateOrderData = z.infer<typeof updateOrderSchema>;
export type TOrderListQuery = z.infer<typeof orderListQuerySchema>;
export type TUpdateOrderMeasurementData = z.infer<
  typeof updateOrderMeasurementSchema
>;
export type TApplyMeasurementsToDefaultData = z.infer<
  typeof applyMeasurementsToDefaultSchema
>;
