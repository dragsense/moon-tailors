import { z } from "zod";
import {
  createPaginatedSchema,
  listQuerySchema,
} from "../../common/schema.js";
import { field } from "../../lib/field-meta.js";
import { EStaffPayType } from "./enum.js";

const STAFF_PAY_TYPE_OPTIONS = [
  { label: "Fixed salary", value: EStaffPayType.FIXED },
  { label: "On demand", value: EStaffPayType.ON_DEMAND },
];

const staffPayTypeSchema = z.enum([
  EStaffPayType.FIXED,
  EStaffPayType.ON_DEMAND,
]);

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

/** Everything about a staff member — who they are and how they are paid. */
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
  payType: field(staffPayTypeSchema.default(EStaffPayType.FIXED), {
    type: "select",
    label: "Pay type",
    required: true,
    order: 4,
    options: STAFF_PAY_TYPE_OPTIONS,
  }),
  /** Monthly salary for fixed staff; the usual rate for on-demand staff. */
  salary: field(
    z.coerce.number().min(0, "Salary cannot be negative").default(0),
    {
      type: "number",
      label: "Salary / rate",
      order: 5,
    },
  ),
  address: optionalText("Address", 6, 255),
  notes: notesField(7),
});

/** POST /staff */
export const createStaffSchema = staffProfileSchema;

/** PATCH /staff/:id */
export const updateStaffSchema = staffProfileSchema.partial();

/**
 * POST /staff/:id/payments — money handed over. Never capped.
 *
 * `totalAmount` is what the work was worth and only applies to on-demand
 * staff; for fixed-salary staff the total comes from their monthly salary, so
 * the field is hidden on the form and ignored by the API.
 */
export const createStaffPaymentSchema = z.object({
  paymentDate: field(z.string().min(1, "Payment date is required"), {
    type: "date",
    label: "Payment date",
    required: true,
    order: 1,
  }),
  totalAmount: field(
    z.coerce.number().min(0, "Total cannot be negative").optional(),
    {
      type: "number",
      label: "Total amount",
      order: 2,
    },
  ),
  amount: field(z.coerce.number().positive("Amount must be more than 0"), {
    type: "number",
    label: "Paid amount",
    required: true,
    order: 3,
  }),
  notes: notesField(4),
});

/** PATCH /staff/:id/payments/:paymentId — same fields, all optional. */
export const updateStaffPaymentSchema = createStaffPaymentSchema.partial();

export const staffPaymentSchema = z.object({
  id: z.string().uuid(),
  paymentDate: z.string(),
  /** What the work was worth. Null for fixed-salary staff. */
  totalAmount: z.number().nullable(),
  /** What was actually handed over. */
  amount: z.number(),
  notes: z.string().optional(),
});

export const staffSchema = staffProfileSchema.extend({
  id: z.string().uuid(),
  /** Sum of every payment ever made to them. */
  totalPaid: z.number(),
  /**
   * Every recorded total added up. On-demand only — a fixed salary has no
   * lifetime total, since nothing records which months they worked.
   */
  totalAmount: z.number().nullable(),
  /** `totalAmount − totalPaid`. Null wherever `totalAmount` is. */
  totalRemaining: z.number().nullable(),
  /** Newest first; present on the detail endpoint only. */
  payments: z.array(staffPaymentSchema).optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

const anyToUndefined = (v: unknown) =>
  v === "" || v === "__any__" ? undefined : v;

export const staffListQuerySchema = listQuerySchema.extend({
  payType: field(z.preprocess(anyToUndefined, staffPayTypeSchema.optional()), {
    type: "select",
    label: "Pay type",
    placeholder: "All pay types",
    order: 2,
    filter: "eq",
    options: [{ label: "Any", value: "__any__" }, ...STAFF_PAY_TYPE_OPTIONS],
  }),
});

/** GET /staff/:id/slip?month=YYYY-MM */
export const staffSlipQuerySchema = z.object({
  month: z
    .string()
    .regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Month must look like 2026-09"),
});

/**
 * One month of pay for one staff member. The total comes from the monthly
 * salary for fixed staff, and from the month’s `totalAmount` entries for
 * on-demand staff. None of it caps what can be paid.
 */
export const staffSlipSchema = z.object({
  month: z.string(),
  staff: z.object({
    id: z.string().uuid(),
    name: z.string(),
    phone: z.string(),
    role: z.string().optional(),
    payType: staffPayTypeSchema,
    salary: z.number(),
  }),
  /** Monthly salary (fixed) or the month’s totals added up (on demand). */
  total: z.number(),
  /** Sum of the amounts actually paid in the month. */
  paid: z.number(),
  /** `total − paid`, negative when they were paid over the total. */
  remaining: z.number(),
  /** Sum of every payment ever made to them. */
  totalPaid: z.number(),
});

export const paginatedStaffSchema = createPaginatedSchema(staffSchema);
