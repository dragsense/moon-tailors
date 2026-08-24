import type { z } from "zod";
import {
  customerSchema,
  measurementSchema,
  paginatedCustomersSchema,
} from "./schema.js";

export interface IMeasurement extends z.infer<typeof measurementSchema> {}

export interface ICustomer extends z.infer<typeof customerSchema> {}

export interface IPaginatedCustomers
  extends z.infer<typeof paginatedCustomersSchema> {}
