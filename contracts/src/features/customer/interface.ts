import type { z } from "zod";
import {
  customerSchema,
  paginatedCustomersSchema,
} from "./schema.js";

export interface ICustomer extends z.infer<typeof customerSchema> {}

export interface IPaginatedCustomers
  extends z.infer<typeof paginatedCustomersSchema> {}
