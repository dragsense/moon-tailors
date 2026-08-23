import { z } from "zod";
import {
  createPaginatedSchema,
  listQuerySchema,
} from "../../common/schema.js";
import { field } from "../../lib/field-meta.js";
import { EBillingStatus, EBillingType } from "./enum.js";

export const billingLineItemSchema = z.object({
  description: field(z.string().min(1).max(255), {
    type: "text",
    label: "Description",
    required: true,
    order: 1,
  }),
  quantity: field(z.coerce.number().min(1).default(1), {
    type: "number",
    label: "Qty",
    required: true,
    order: 2,
  }),
  unitPrice: field(z.coerce.number().min(0), {
    type: "number",
    label: "Unit price",
    required: true,
    order: 3,
  }),
});

/** Step 1 fields */
export const createBillingSchema = z.object({
  title: field(z.string().min(1).max(200), {
    type: "text",
    label: "Title",
    required: true,
    order: 1,
  }),
  type: field(z.nativeEnum(EBillingType).default(EBillingType.PRODUCT), {
    type: "select",
    label: "Type",
    required: true,
    order: 2,
    options: Object.values(EBillingType).map((value) => ({
      label: value,
      value,
    })),
  }),
  description: field(z.string().max(2000).optional(), {
    type: "textarea",
    label: "Description",
    order: 3,
  }),
  issueDate: field(z.string().min(1), {
    type: "date",
    label: "Issue date",
    required: true,
    order: 4,
  }),
  dueDate: field(z.string().min(1), {
    type: "date",
    label: "Due date",
    required: true,
    order: 5,
  }),
  /** Step 2 */
  lineItems: z.array(billingLineItemSchema).min(1),
  taxRate: field(z.coerce.number().min(0).max(50).default(0), {
    type: "number",
    label: "Tax %",
    order: 10,
  }),
  /** Step 3 */
  recipientUserId: field(z.string().uuid(), {
    type: "select",
    label: "Recipient",
    required: true,
    order: 20,
  }),
  notes: field(z.string().max(2000).optional(), {
    type: "textarea",
    label: "Notes",
    order: 21,
  }),
});

export const updateBillingSchema = createBillingSchema.partial();

export const billingSchema = createBillingSchema.extend({
  id: z.string().uuid(),
  status: z.nativeEnum(EBillingStatus),
  amountCents: z.number().int().nonnegative(),
  paidAmountCents: z.number().int().nonnegative(),
  paymentIntentId: z.string().nullable().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const billingListQuerySchema = listQuerySchema.extend({
  status: field(z.nativeEnum(EBillingStatus).optional(), {
    type: "select",
    label: "Status",
    order: 2,
    filter: "eq",
    options: [
      { label: "Any", value: "__any__" },
      ...Object.values(EBillingStatus).map((value) => ({
        label: value,
        value,
      })),
    ],
  }),
  type: field(z.nativeEnum(EBillingType).optional(), {
    type: "select",
    label: "Type",
    order: 3,
    filter: "eq",
    options: [
      { label: "Any", value: "__any__" },
      ...Object.values(EBillingType).map((value) => ({
        label: value,
        value,
      })),
    ],
  }),
  recipientUserId: field(z.string().uuid().optional(), {
    type: "select",
    label: "Recipient",
    order: 4,
    filter: "eq",
  }),
});

export const paginatedBillingsSchema = createPaginatedSchema(billingSchema);

export const payBillingSchema = z.object({
  paymentMethodId: z.string().min(1),
  /** Platform cut in cents (Connect application fee / “split”). */
  applicationFeeAmountCents: z.coerce.number().int().min(0).optional(),
});
