import { z } from "zod";
import {
  createPaginatedSchema,
  listQuerySchema,
} from "../../common/schema.js";
import { field } from "../../lib/field-meta.js";
import {
  measurementSchema,
  measurementValuesSchema,
} from "../measurement/schema.js";
import { EGender } from "../user/enum.js";

const optionalText = (label: string, order: number, max = 120) =>
  field(z.string().trim().max(max).optional().or(z.literal("")), {
    type: "text",
    label,
    order,
  });

const customerGenderSchema = field(
  z.enum([EGender.MALE, EGender.FEMALE]).default(EGender.MALE),
  {
    type: "select",
    label: "Gender",
    required: true,
    order: 2,
    options: [
      { label: "Male", value: EGender.MALE },
      { label: "Female", value: EGender.FEMALE },
    ],
  },
);

export const createCustomerSchema = z.object({
  name: field(z.string().trim().min(1, "Name is required").max(120), {
    type: "text",
    label: "Name",
    placeholder: "Customer name",
    required: true,
    order: 1,
  }),
  gender: customerGenderSchema,
  phone: field(z.string().trim().min(1, "Phone is required").max(40), {
    type: "text",
    label: "Phone",
    placeholder: "03xx…",
    required: true,
    order: 3,
  }),
  alternative: optionalText("Alternative or WhatsApp", 4, 40),
  email: field(z.string().trim().max(255).optional().or(z.literal("")), {
    type: "hidden",
    label: "Email",
    order: 5,
  }),
  address: optionalText("Address", 6, 255),
  notes: field(z.string().trim().max(2000).optional().or(z.literal("")), {
    type: "textarea",
    label: "Notes",
    order: 7,
  }),
  measurement: field(measurementValuesSchema.optional(), {
    type: "hidden",
    order: 99,
  }),
});

export const updateCustomerSchema = createCustomerSchema
  .omit({ measurement: true })
  .partial();

export const customerSchema = createCustomerSchema
  .omit({ measurement: true })
  .extend({
    id: z.string().uuid(),
    /** Customer’s single usual (default) measurement, if any. */
    measurement: measurementSchema.nullish(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  });

export const customerListQuerySchema = listQuerySchema.extend({});
export const paginatedCustomersSchema = createPaginatedSchema(customerSchema);
