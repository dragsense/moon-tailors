import type { z } from "zod";
import {
  createStaffPaymentSchema,
  createStaffSchema,
  staffListQuerySchema,
  staffSlipQuerySchema,
  updateStaffPaymentSchema,
  updateStaffSchema,
} from "./schema.js";

export type TCreateStaffData = z.infer<typeof createStaffSchema>;
export type TUpdateStaffData = z.infer<typeof updateStaffSchema>;
export type TStaffListQuery = z.infer<typeof staffListQuerySchema>;
export type TCreateStaffPaymentData = z.infer<typeof createStaffPaymentSchema>;
export type TUpdateStaffPaymentData = z.infer<typeof updateStaffPaymentSchema>;
export type TStaffSlipQuery = z.infer<typeof staffSlipQuerySchema>;
