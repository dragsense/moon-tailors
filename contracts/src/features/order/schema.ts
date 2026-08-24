import { z } from "zod";
import {
  createPaginatedSchema,
  listQuerySchema,
} from "../../common/schema.js";
import { field } from "../../lib/field-meta.js";
import {
  customerSchema,
  measurementSchema,
  updateMeasurementSchema,
} from "../customer/schema.js";
import { EOrderStatus } from "./enum.js";

export const orderStatusSchema = z.nativeEnum(EOrderStatus);

export const ORDER_STATUS_OPTIONS = [
  { label: "New", value: EOrderStatus.NEW },
  { label: "Stitching", value: EOrderStatus.STITCHING },
  { label: "Stitched", value: EOrderStatus.STITCHED },
  { label: "Ready", value: EOrderStatus.READY },
  { label: "Delivered", value: EOrderStatus.DELIVERED },
];

export const createOrderSchema = z.object({
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
});

export const updateOrderSchema = createOrderSchema
  .omit({ customerId: true })
  .partial()
  .extend({
    forceEdit: z.boolean().optional(),
  });

const orderCustomerSchema = customerSchema.pick({
  id: true,
  name: true,
  phone: true,
  whatsapp: true,
});

export const orderSchema = createOrderSchema.extend({
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

export const updateOrderMeasurementSchema = updateMeasurementSchema.extend({
  forceEdit: z.boolean().optional(),
});

export const orderListQuerySchema = listQuerySchema.extend({
  status: field(
    z.preprocess(
      (v) => (v === "" || v === "__any__" ? undefined : v),
      orderStatusSchema.optional(),
    ), {
    type: "select",
    label: "Status",
    placeholder: "All statuses",
    order: 2,
    filter: "eq",
    options: [{ label: "Any", value: "__any__" }, ...ORDER_STATUS_OPTIONS],
  }),
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
});

export const paginatedOrdersSchema = createPaginatedSchema(orderSchema);
