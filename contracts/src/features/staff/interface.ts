import type { z } from "zod";
import {
  paginatedStaffSchema,
  staffPaymentSchema,
  staffSchema,
  staffSlipSchema,
} from "./schema.js";

export interface IStaff extends z.infer<typeof staffSchema> {}

export interface IStaffPayment extends z.infer<typeof staffPaymentSchema> {}

export interface IStaffSlip extends z.infer<typeof staffSlipSchema> {}

export interface IPaginatedStaff extends z.infer<typeof paginatedStaffSchema> {}
