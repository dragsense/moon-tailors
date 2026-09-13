import type { z } from "zod";
import {
  createStaffSchema,
  staffLeaveSchema,
  staffListQuerySchema,
  staffRejoinSchema,
  staffSalarySchema,
  updateStaffSchema,
} from "./schema.js";

export type TStaffSalaryData = z.infer<typeof staffSalarySchema>;

export type TCreateStaffData = z.infer<typeof createStaffSchema>;
export type TUpdateStaffData = z.infer<typeof updateStaffSchema>;
export type TStaffListQuery = z.infer<typeof staffListQuerySchema>;
export type TStaffLeaveData = z.infer<typeof staffLeaveSchema>;
export type TStaffRejoinData = z.infer<typeof staffRejoinSchema>;
