import { z } from "zod";
import {
  createPaginatedSchema,
  listQuerySchema,
} from "../../common/schema.js";
import { field } from "../../lib/field-meta.js";
import { garmentTypeSchema } from "../garment-type/schema.js";
import { EGender } from "../user/enum.js";

const optionalText = (label: string, order: number, max = 120) =>
  field(z.string().trim().max(max).optional().or(z.literal("")), {
    type: "text",
    label,
    order,
  });

const optionalMeasure = (label: string, order: number) =>
  field(z.coerce.number().min(0).max(500).nullable().optional(), {
    type: "number",
    label,
    order,
  });

/** Numeric / note fields stored on a measurement row (type lives on garmentTypeId). */
export const measurementValuesSchema = z.object({
  length: optionalMeasure("Length", 1),
  chest: optionalMeasure("Chest", 2),
  waist: optionalMeasure("Waist", 3),
  hip: optionalMeasure("Hip", 4),
  shoulder: optionalMeasure("Shoulder", 5),
  sleeve: optionalMeasure("Sleeve", 6),
  neck: optionalMeasure("Neck", 7),
  armhole: optionalMeasure("Armhole", 8),
  cuff: optionalMeasure("Cuff", 9),
  trouserLength: optionalMeasure("Trouser length", 10),
  thigh: optionalMeasure("Thigh", 11),
  bottom: optionalMeasure("Bottom", 12),
  extraNotes: field(z.string().trim().max(2000).optional().or(z.literal("")), {
    type: "textarea",
    label: "Measurement notes",
    order: 13,
  }),
});

export const updateMeasurementSchema = measurementValuesSchema;

export const MEASUREMENT_VALUE_KEYS = [
  "length",
  "chest",
  "waist",
  "hip",
  "shoulder",
  "sleeve",
  "neck",
  "armhole",
  "cuff",
  "trouserLength",
  "thigh",
  "bottom",
  "extraNotes",
] as const;

export function pickMeasurementValues(
  input?: Partial<z.infer<typeof measurementValuesSchema>> | null,
): z.infer<typeof measurementValuesSchema> {
  const values: z.infer<typeof measurementValuesSchema> = {};
  if (!input) return values;
  for (const key of MEASUREMENT_VALUE_KEYS) {
    if (input[key] !== undefined) {
      (values as Record<string, unknown>)[key] = input[key];
    }
  }
  return values;
}

export function hasMeasurementValues(
  input?: Partial<z.infer<typeof measurementValuesSchema>> | null,
): input is z.infer<typeof measurementValuesSchema> {
  if (!input) return false;
  return MEASUREMENT_VALUE_KEYS.some((key) => {
    const value = input[key];
    return value !== undefined && value !== null && value !== "";
  });
}

export const measurementInputSchema = measurementValuesSchema.extend({
  garmentTypeId: z.string().uuid(),
});

export const measurementSchema = measurementValuesSchema.extend({
  id: z.string().uuid(),
  customerId: z.string().uuid(),
  orderId: z.string().uuid().nullable(),
  garmentTypeId: z.string().uuid(),
  garmentType: garmentTypeSchema.nullish(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const copyCustomerMeasurementSchema = z.object({
  fromGarmentTypeId: z.string().uuid(),
  toGarmentTypeId: z.string().uuid(),
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
  whatsapp: optionalText("WhatsApp", 4, 40),
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
  measurements: field(z.array(measurementInputSchema).optional(), {
    type: "hidden",
    order: 99,
  }),
});

export const updateCustomerSchema = createCustomerSchema
  .omit({ measurements: true })
  .partial();

export const customerSchema = createCustomerSchema
  .omit({ measurements: true })
  .extend({
    id: z.string().uuid(),
    measurements: z.array(measurementSchema),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  });

export const customerListQuerySchema = listQuerySchema.extend({});

export const paginatedCustomersSchema = createPaginatedSchema(customerSchema);
