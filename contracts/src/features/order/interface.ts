import type { z } from "zod";
import { orderSchema, paginatedOrdersSchema } from "./schema.js";

export interface IOrder extends z.infer<typeof orderSchema> {}

export interface IPaginatedOrders
  extends z.infer<typeof paginatedOrdersSchema> {}
