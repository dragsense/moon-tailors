import { z } from "zod";
import {
  createPaginatedSchema,
  listQuerySchema,
} from "../../common/schema.js";
import { field } from "../../lib/field-meta.js";
import { EStaffPayType, EStaffStatus } from "./enum.js";

const STAFF_PAY_TYPE_OPTIONS = [
  { label: "Fixed salary", value: EStaffPayType.FIXED },
  { label: "On demand", value: EStaffPayType.ON_DEMAND },
];

const STAFF_STATUS_OPTIONS = [
  { label: "Active", value: EStaffStatus.ACTIVE },
  { label: "Left", value: EStaffStatus.LEFT },
];

const staffPayTypeSchema = z.enum([
  EStaffPayType.FIXED,
  EStaffPayType.ON_DEMAND,
]);

const staffStatusSchema = z.enum([EStaffStatus.ACTIVE, EStaffStatus.LEFT]);

const optionalText = (label: string, order: number, max = 120) =>
  field(z.string().trim().max(max).optional().or(z.literal("")), {
    type: "text",
    label,
    order,
  });

const notesField = (order: number) =>
  field(z.string().trim().max(2000).optional().or(z.literal("")), {
    type: "textarea",
    label: "Notes",
    order,
  });

/** Plain staff info — no pay or dates (those live in work periods). */
export const staffProfileSchema = z.object({
  name: field(z.string().trim().min(1, "Name is required").max(120), {
    type: "text",
    label: "Name",
    placeholder: "Staff name",
    required: true,
    order: 1,
  }),
  phone: field(z.string().trim().min(1, "Phone is required").max(40), {
    type: "text",
    label: "Phone",
    placeholder: "03xx…",
    required: true,
    order: 2,
  }),
  role: optionalText("Role", 3, 80),
  address: optionalText("Address", 4, 255),
  notes: notesField(5),
});

/** Join date, pay type and salary for one work period. */
const workPeriodShape = {
  joinDate: field(z.string().min(1, "Join date is required"), {
    type: "date",
    label: "Join date",
    required: true,
    order: 20,
  }),
  payType: field(staffPayTypeSchema.default(EStaffPayType.FIXED), {
    type: "select",
    label: "Pay type",
    required: true,
    order: 21,
    options: STAFF_PAY_TYPE_OPTIONS,
  }),
  /** Monthly salary for fixed staff; usual rate for on-demand staff. */
  salary: field(
    z.coerce.number().min(0, "Salary cannot be negative").default(0),
    {
      type: "number",
      label: "Salary / rate",
      order: 22,
    },
  ),
};

/** POST /staff — profile + first work period. */
export const createStaffSchema = staffProfileSchema.extend(workPeriodShape);

/** PATCH /staff/:id — profile only; pay changes go through leave/rejoin. */
export const updateStaffSchema = staffProfileSchema.partial();

/** POST /staff/:id/leave — closes the open work period. */
export const staffLeaveSchema = z.object({
  leaveDate: field(z.string().min(1, "Leave date is required"), {
    type: "date",
    label: "Leave date",
    required: true,
    order: 1,
  }),
  reason: field(z.string().trim().max(500).optional().or(z.literal("")), {
    type: "textarea",
    label: "Reason",
    order: 2,
  }),
});

/** PATCH /staff/:id/salary — changes salary / rate on the open work period. */
export const staffSalarySchema = z.object({
  salary: workPeriodShape.salary,
});

/** POST /staff/:id/rejoin — opens a new work period. */
export const staffRejoinSchema = z.object({
  ...workPeriodShape,
  notes: notesField(23),
});

/** One join → leave period. `leaveDate` is null while still working. */
export const staffEmploymentSchema = z.object({
  id: z.string().uuid(),
  joinDate: z.string(),
  leaveDate: z.string().nullable(),
  payType: staffPayTypeSchema,
  salary: z.number(),
  leaveReason: z.string().optional(),
  notes: z.string().optional(),
});

export const staffSchema = staffProfileSchema.extend({
  id: z.string().uuid(),
  status: staffStatusSchema,
  /** Latest work period (open one when active); null if none recorded. */
  currentEmployment: staffEmploymentSchema.nullable(),
  /** Full history, newest first. */
  employments: z.array(staffEmploymentSchema),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

const anyToUndefined = (v: unknown) =>
  v === "" || v === "__any__" ? undefined : v;

export const staffListQuerySchema = listQuerySchema.extend({
  status: field(z.preprocess(anyToUndefined, staffStatusSchema.optional()), {
    type: "select",
    label: "Status",
    placeholder: "All statuses",
    order: 2,
    filter: "eq",
    options: [{ label: "Any", value: "__any__" }, ...STAFF_STATUS_OPTIONS],
  }),
});

export const paginatedStaffSchema = createPaginatedSchema(staffSchema);
