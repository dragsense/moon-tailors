import type { z } from "zod";
import {
  createCustomerSchema,
  customerListQuerySchema,
  updateCustomerSchema,
} from "./schema.js";

export type TCreateCustomerData = z.infer<typeof createCustomerSchema>;
export type TUpdateCustomerData = z.infer<typeof updateCustomerSchema>;
export type TCustomerListQuery = z.infer<typeof customerListQuerySchema>;
