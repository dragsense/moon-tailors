import { z } from "zod";
import {
  createPaginatedSchema,
  listQuerySchema,
} from "../../common/schema.js";
import { field } from "../../lib/field-meta.js";

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

/** Plain vendor info. */
export const vendorProfileSchema = z.object({
  name: field(z.string().trim().min(1, "Name is required").max(120), {
    type: "text",
    label: "Name",
    placeholder: "Vendor name",
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
  company: optionalText("Company / shop", 3, 120),
  address: optionalText("Address", 4, 255),
  notes: notesField(5),
});

/** POST /vendors */
export const createVendorSchema = vendorProfileSchema;

/** PATCH /vendors/:id */
export const updateVendorSchema = vendorProfileSchema.partial();

/** One purchased item — line total = quantity × unit price (never stored). */
export const vendorPurchaseItemInputSchema = z.object({
  description: z.string().trim().min(1, "Item name is required").max(160),
  quantity: z.coerce.number().positive("Quantity must be more than 0"),
  unitPrice: z.coerce.number().min(0, "Price cannot be negative"),
});

/** POST /vendors/:id/purchases */
export const createVendorPurchaseSchema = z.object({
  purchaseDate: field(z.string().min(1, "Purchase date is required"), {
    type: "date",
    label: "Purchase date",
    required: true,
    order: 1,
  }),
  notes: notesField(2),
  items: field(
    z.array(vendorPurchaseItemInputSchema).min(1, "Add at least one item"),
    { type: "hidden", order: 3 },
  ),
});

/** POST /vendors/:id/payments — paid against the vendor’s overall balance. */
export const createVendorPaymentSchema = z.object({
  paymentDate: field(z.string().min(1, "Payment date is required"), {
    type: "date",
    label: "Payment date",
    required: true,
    order: 1,
  }),
  amount: field(z.coerce.number().positive("Amount must be more than 0"), {
    type: "number",
    label: "Amount",
    required: true,
    order: 2,
  }),
  notes: notesField(3),
});

export const vendorPurchaseItemSchema = vendorPurchaseItemInputSchema.extend({
  id: z.string().uuid(),
  /** quantity × unitPrice */
  total: z.number(),
});

export const vendorPurchaseSchema = z.object({
  id: z.string().uuid(),
  purchaseDate: z.string(),
  notes: z.string().optional(),
  items: z.array(vendorPurchaseItemSchema),
  /** Sum of line totals. */
  total: z.number(),
});

export const vendorPaymentSchema = z.object({
  id: z.string().uuid(),
  paymentDate: z.string(),
  amount: z.number(),
  notes: z.string().optional(),
});

/** Calculated on read — never stored. */
export const vendorTotalsSchema = z.object({
  /** Sum of all purchase line items. */
  total: z.number(),
  /** Sum of all payments. */
  paid: z.number(),
  /** total − paid */
  remaining: z.number(),
});

export const vendorSchema = vendorProfileSchema.extend({
  id: z.string().uuid(),
  totals: vendorTotalsSchema,
  /** Newest first; present on the detail endpoint. */
  purchases: z.array(vendorPurchaseSchema).optional(),
  /** Newest first; present on the detail endpoint. */
  payments: z.array(vendorPaymentSchema).optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

/** GET /vendors/:id/slip?month=YYYY-MM */
export const vendorSlipQuerySchema = z.object({
  month: z
    .string()
    .regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Month must look like 2026-09"),
});

/**
 * One month with a vendor: what was bought, what was paid, what is left of
 * that month. The running balance across all time lives on the vendor itself.
 */
export const vendorSlipSchema = z.object({
  month: z.string(),
  vendor: z.object({
    id: z.string().uuid(),
    name: z.string(),
    phone: z.string(),
    company: z.string().optional(),
  }),
  /** Purchases dated in the month, added up from their line items. */
  total: z.number(),
  /** Payments dated in the month. */
  paid: z.number(),
  /** `total − paid` for the month alone, negative when overpaid. */
  remaining: z.number(),
});

export const vendorListQuerySchema = listQuerySchema.extend({});
export const paginatedVendorsSchema = createPaginatedSchema(vendorSchema);
