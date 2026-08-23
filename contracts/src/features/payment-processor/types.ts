import type { z } from "zod";
import {
  paymentProcessorCurrentSchema,
  paymentProcessorListQuerySchema,
  paymentProcessorSchema,
} from "./schema.js";

export type TPaymentProcessorListQuery = z.infer<
  typeof paymentProcessorListQuerySchema
>;
export interface IPaymentProcessor
  extends z.infer<typeof paymentProcessorSchema> {}
export interface IPaymentProcessorCurrent
  extends z.infer<typeof paymentProcessorCurrentSchema> {}
