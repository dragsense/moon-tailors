import { z } from "zod";
import {
  createPaginatedSchema,
  listQuerySchema,
} from "../../common/schema.js";
import { field } from "../../lib/field-meta.js";
import { customerSchema } from "../customer/schema.js";
import {
  measurementSchema,
  measurementValuesSchema,
  updateMeasurementSchema,
} from "../measurement/schema.js";
import { EOrderStatus } from "./enum.js";

export const orderStatusSchema = z.nativeEnum(EOrderStatus);

export const ORDER_STATUS_OPTIONS = [
  { label: "New", value: EOrderStatus.NEW },
  { label: "Stitching", value: EOrderStatus.STITCHING },
  { label: "Stitched", value: EOrderStatus.STITCHED },
  { label: "Ready", value: EOrderStatus.READY },
  { label: "Delivered", value: EOrderStatus.DELIVERED },
  { label: "Canceled", value: EOrderStatus.CANCELED },
];

function dateKey(value: string): string {
  return value.slice(0, 10);
}

function readyByAfterOrderDate(
  data: { orderDate?: string; expectedCompletionDate?: string },
  ctx: z.RefinementCtx,
): void {
  const orderDate = data.orderDate ? dateKey(data.orderDate) : "";
  const readyBy = data.expectedCompletionDate
    ? dateKey(data.expectedCompletionDate)
    : "";
  if (!orderDate || !readyBy) return;
  if (readyBy < orderDate) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["expectedCompletionDate"],
      message: "Ready by must be on or after the order date",
    });
  }
}

const createOrderObject = z.object({
  customerId: field(z.string().uuid(), {
    type: "hidden",
    label: "Customer",
    required: true,
    order: 1,
  }),
  orderDate: field(z.string().min(1, "Order date is required"), {
    type: "date",
    label: "Order date",
    required: true,
    order: 2,
  }),
  expectedCompletionDate: field(
    z.string().min(1, "Expected completion date is required"),
    {
      type: "date",
      label: "Expected completion",
      required: true,
      order: 3,
    },
  ),
  status: field(orderStatusSchema.default(EOrderStatus.NEW), {
    type: "select",
    label: "Status",
    required: true,
    order: 4,
    options: ORDER_STATUS_OPTIONS,
  }),
  totalCost: field(z.coerce.number().min(0, "Total cost cannot be negative"), {
    type: "number",
    label: "Total cost",
    required: true,
    order: 5,
  }),
  paidAmount: field(z.coerce.number().min(0).default(0), {
    type: "number",
    label: "Paid amount",
    order: 6,
  }),
  notes: field(z.string().trim().max(2000).optional().or(z.literal("")), {
    type: "textarea",
    label: "Notes",
    order: 7,
  }),
  garmentType: field(
    z.string().trim().min(1, "Garment type is required").max(120),
    {
      type: "text",
      label: "Garment type",
      placeholder: "e.g. Shalwar kameez, Pant shirt",
      required: true,
      order: 8,
    },
  ),
  measurement: measurementValuesSchema.optional(),
  replaceDefault: field(z.boolean().optional().default(false), {
    type: "hidden",
    label: "Replace usual measurements",
    order: 9,
  }),
});

export const createOrderSchema =
  createOrderObject.superRefine(readyByAfterOrderDate);

export const updateOrderSchema = createOrderObject
  .omit({
    customerId: true,
    measurement: true,
    replaceDefault: true,
  })
  .partial()
  .extend({
    forceEdit: z.boolean().optional(),
  })
  .superRefine(readyByAfterOrderDate);

export const applyMeasurementsToDefaultSchema = z.object({});

/** POST /orders/:id/receive-payment — money the customer paid; added to paidAmount. */
export const receiveOrderPaymentSchema = z.object({
  amount: field(z.coerce.number().positive("Amount must be more than 0"), {
    type: "number",
    label: "Amount received",
    required: true,
    order: 1,
  }),
});

export type TReceiveOrderPaymentData = z.infer<typeof receiveOrderPaymentSchema>;

const orderCustomerSchema = customerSchema.pick({
  id: true,
  name: true,
  phone: true,
  alternative: true,
  gender: true,
});

export const orderSchema = createOrderObject
  .omit({
    replaceDefault: true,
  })
  .extend({
    id: z.string().uuid(),
    orderNumber: z.string(),
    measurementId: z.string().uuid(),
    customer: orderCustomerSchema.optional(),
    measurement: measurementSchema.nullish(),
    remainingAmount: z.number(),
    isDelayed: z.boolean(),
    isLocked: z.boolean(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  });

export const updateOrderMeasurementSchema = updateMeasurementSchema;

export const orderListQuerySchema = listQuerySchema.extend({
  status: field(
    z.preprocess(
      (v) => (v === "" || v === "__any__" ? undefined : v),
      orderStatusSchema.optional(),
    ),
    {
      type: "select",
      label: "Status",
      placeholder: "All statuses",
      order: 2,
      filter: "eq",
      options: [{ label: "Any", value: "__any__" }, ...ORDER_STATUS_OPTIONS],
    },
  ),
  customerId: field(
    z.preprocess(
      (v) => (v === "" || v === "__any__" ? undefined : v),
      z.string().uuid().optional(),
    ),
    {
      type: "hidden",
      label: "Customer",
      order: 3,
      filter: "eq",
    },
  ),
  delayed: field(
    z.preprocess((v) => {
      if (v === true || v === "true" || v === "1" || v === 1) return true;
      return undefined;
    }, z.boolean().optional()),
    {
      type: "switch",
      label: "Late only",
      order: 4,
    },
  ),
});

export const paginatedOrdersSchema = createPaginatedSchema(orderSchema);
