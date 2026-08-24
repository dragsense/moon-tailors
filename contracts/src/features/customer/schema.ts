import { z } from "zod";
import {
  createPaginatedSchema,
  listQuerySchema,
} from "../../common/schema.js";
import { field } from "../../lib/field-meta.js";
import { EGarmentType } from "./enum.js";

export const garmentTypeSchema = z.nativeEnum(EGarmentType);

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

/** Numeric / note fields stored on the measurements table. */
export const measurementValuesSchema = z.object({
  garmentType: field(garmentTypeSchema.optional(), {
    type: "select",
    label: "Garment",
    order: 1,
    options: [
      { label: "Shalwar kameez", value: EGarmentType.SHALWAR_KAMEEZ },
      { label: "Shirt", value: EGarmentType.SHIRT },
      { label: "Pant", value: EGarmentType.PANT },
      { label: "Coat", value: EGarmentType.COAT },
      { label: "Waistcoat", value: EGarmentType.WAISTCOAT },
      { label: "Other", value: EGarmentType.OTHER },
    ],
  }),
  length: optionalMeasure("Length", 2),
  chest: optionalMeasure("Chest", 3),
  waist: optionalMeasure("Waist", 4),
  hip: optionalMeasure("Hip", 5),
  shoulder: optionalMeasure("Shoulder", 6),
  sleeve: optionalMeasure("Sleeve", 7),
  neck: optionalMeasure("Neck", 8),
  armhole: optionalMeasure("Armhole", 9),
  cuff: optionalMeasure("Cuff", 10),
  trouserLength: optionalMeasure("Trouser length", 11),
  thigh: optionalMeasure("Thigh", 12),
  bottom: optionalMeasure("Bottom", 13),
  extraNotes: field(z.string().trim().max(2000).optional().or(z.literal("")), {
    type: "textarea",
    label: "Measurement notes",
    order: 14,
  }),
});

export const updateMeasurementSchema = measurementValuesSchema;

export const MEASUREMENT_VALUE_KEYS = [
  "garmentType",
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

export const measurementSchema = measurementValuesSchema.extend({
  id: z.string().uuid(),
  customerId: z.string().uuid(),
  orderId: z.string().uuid().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const createCustomerSchema = z.object({
  name: field(z.string().trim().min(1, "Name is required").max(120), {
    type: "text",
    label: "Name",
    placeholder: "Customer name",
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
  whatsapp: optionalText("WhatsApp", 3, 40),
  email: optionalText("Email", 4, 255),
  address: optionalText("Address", 5, 255),
  notes: field(z.string().trim().max(2000).optional().or(z.literal("")), {
    type: "textarea",
    label: "Notes",
    order: 6,
  }),
  defaultMeasurement: measurementValuesSchema.optional(),
});

export const updateCustomerSchema = createCustomerSchema
  .omit({ defaultMeasurement: true })
  .partial();

export const customerSchema = createCustomerSchema.extend({
  id: z.string().uuid(),
  defaultMeasurementId: z.string().uuid().nullable(),
  defaultMeasurement: measurementSchema.nullish(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const customerListQuerySchema = listQuerySchema.extend({});

export const paginatedCustomersSchema = createPaginatedSchema(customerSchema);
