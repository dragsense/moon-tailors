import { z } from "zod";
import { listQuerySchema } from "../../common/schema.js";
import { EPaymentProcessorType } from "./enum.js";

/** GET /payment-processors query */
export const paymentProcessorListQuerySchema = listQuerySchema;

export const paymentProcessorSchema = z.object({
  id: z.string().uuid(),
  type: z.nativeEnum(EPaymentProcessorType),
  name: z.string(),
  enabled: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const paymentProcessorCurrentSchema = z.object({
  processor: paymentProcessorSchema,
  source: z.enum(["business", "env_default"]),
  stripeEnabled: z.boolean(),
});
