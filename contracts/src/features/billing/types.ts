import type { z } from "zod";
import {
  billingSchema,
  createBillingSchema,
  updateBillingSchema,
  billingListQuerySchema,
  billingLineItemSchema,
  payBillingSchema,
  paginatedBillingsSchema,
} from "./schema.js";

export type TBillingLineItem = z.infer<typeof billingLineItemSchema>;
export type TCreateBilling = z.infer<typeof createBillingSchema>;
export type TUpdateBilling = z.infer<typeof updateBillingSchema>;
export type IBilling = z.infer<typeof billingSchema>;
export type TBillingListQuery = z.infer<typeof billingListQuerySchema>;
export type TPayBilling = z.infer<typeof payBillingSchema>;
export type IPaginatedBillings = z.infer<typeof paginatedBillingsSchema>;
