import { z } from "zod";
import { field } from "../../lib/field-meta.js";

const optionalMeasure = (label: string, order: number) =>
  field(z.coerce.number().min(0).max(500).nullable().optional(), {
    type: "number",
    label,
    order,
  });

/** Numeric / note fields stored on a measurement row. */
export const measurementValuesSchema = z.object({
  length: optionalMeasure("Length", 1),
  shoulder: optionalMeasure("Teera", 2),
  sleeve: optionalMeasure("Bazo", 3),
  chest: optionalMeasure("Chest", 4),
  waist: optionalMeasure("Kamar", 5),
  hip: optionalMeasure("Hips", 6),
  bottom: optionalMeasure("Daman", 7),
  chak: optionalMeasure("Chak", 8),
  trouserLength: optionalMeasure("Shalwar", 9),
  paincha: optionalMeasure("Paincha", 10),
  belt: optionalMeasure("Belt", 11),
  elastic: optionalMeasure("Elastic", 12),
  extraNotes: field(z.string().trim().max(2000).optional().or(z.literal("")), {
    type: "textarea",
    label: "Measurement notes",
    order: 13,
  }),
});

/** PATCH body — values (+ optional forceEdit for order-linked rows). */
export const updateMeasurementSchema = measurementValuesSchema.extend({
  forceEdit: z.boolean().optional(),
});


export const MEASUREMENT_VALUE_KEYS = [
  "length",
  "shoulder",
  "sleeve",
  "chest",
  "waist",
  "hip",
  "bottom",
  "chak",
  "trouserLength",
  "paincha",
  "belt",
  "elastic",
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
