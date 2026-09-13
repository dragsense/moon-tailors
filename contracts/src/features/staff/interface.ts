import type { z } from "zod";
import {
  paginatedStaffSchema,
  staffEmploymentSchema,
  staffSchema,
} from "./schema.js";

export interface IStaff extends z.infer<typeof staffSchema> {}

export interface IStaffEmployment
  extends z.infer<typeof staffEmploymentSchema> {}

export interface IPaginatedStaff extends z.infer<typeof paginatedStaffSchema> {}
