import { z } from "zod";
import {
  createPaginatedSchema,
  listQuerySchema,
} from "../../common/schema.js";
import { field } from "../../lib/field-meta.js";
import { EGender } from "../user/enum.js";
import { EGarmentAudience } from "./enum.js";

export const garmentAudienceSchema = z.nativeEnum(EGarmentAudience);

export const GARMENT_AUDIENCE_OPTIONS = [
  { label: "Gents", value: EGarmentAudience.GENTS },
  { label: "Ladies", value: EGarmentAudience.LADIES },
];

/** Seeded on boot. Separate rows per audience so gents/ladies each have their own defaults. */
export const SYSTEM_GARMENT_TYPES = [
  { slug: "gents-shalwar-kameez", name: "Shalwar kameez", audience: EGarmentAudience.GENTS, sortOrder: 10 },
  { slug: "gents-kurta", name: "Kurta", audience: EGarmentAudience.GENTS, sortOrder: 20 },
  { slug: "gents-pant-shirt", name: "Pant shirt", audience: EGarmentAudience.GENTS, sortOrder: 25 },
  { slug: "gents-shirt", name: "Shirt", audience: EGarmentAudience.GENTS, sortOrder: 30 },
  { slug: "gents-pant", name: "Pant", audience: EGarmentAudience.GENTS, sortOrder: 40 },
  { slug: "gents-coat", name: "Coat", audience: EGarmentAudience.GENTS, sortOrder: 50 },
  { slug: "gents-waistcoat", name: "Waistcoat", audience: EGarmentAudience.GENTS, sortOrder: 60 },
  { slug: "gents-sherwani", name: "Sherwani", audience: EGarmentAudience.GENTS, sortOrder: 70 },
  { slug: "ladies-shalwar-kameez", name: "Shalwar kameez", audience: EGarmentAudience.LADIES, sortOrder: 10 },
  { slug: "ladies-shirt", name: "Shirt / Kurti", audience: EGarmentAudience.LADIES, sortOrder: 20 },
  { slug: "ladies-shirt-trouser", name: "Shirt trouser", audience: EGarmentAudience.LADIES, sortOrder: 25 },
  { slug: "ladies-trouser", name: "Trouser", audience: EGarmentAudience.LADIES, sortOrder: 30 },
  { slug: "ladies-maxi", name: "Maxi", audience: EGarmentAudience.LADIES, sortOrder: 40 },
  { slug: "ladies-blouse", name: "Blouse", audience: EGarmentAudience.LADIES, sortOrder: 50 },
  { slug: "ladies-coat", name: "Coat", audience: EGarmentAudience.LADIES, sortOrder: 60 },
  { slug: "ladies-lehenga", name: "Lehenga", audience: EGarmentAudience.LADIES, sortOrder: 70 },
] as const;

/** Male → gents types, female → ladies. Other / missing → no filter. */
export function garmentAudienceForGender(
  gender?: EGender | null,
): EGarmentAudience | undefined {
  if (gender === EGender.MALE) return EGarmentAudience.GENTS;
  if (gender === EGender.FEMALE) return EGarmentAudience.LADIES;
  return undefined;
}

export function makeGarmentTypeSlug(
  audience: EGarmentAudience,
  name: string,
): string {
  const stem =
    name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 48) || "garment";
  return `${audience}-${stem}`;
}

export const createGarmentTypeSchema = z.object({
  name: field(z.string().trim().min(1).max(80), {
    type: "text",
    label: "Name",
    placeholder: "e.g. Prince coat",
    required: true,
    order: 1,
  }),
  audience: field(garmentAudienceSchema.default(EGarmentAudience.GENTS), {
    type: "select",
    label: "For",
    required: true,
    order: 2,
    options: GARMENT_AUDIENCE_OPTIONS,
  }),
  sortOrder: field(z.coerce.number().int().min(0).default(0), {
    type: "number",
    label: "Sort order",
    order: 3,
  }),
});

export const updateGarmentTypeSchema = createGarmentTypeSchema.partial();

export const garmentTypeSchema = z.object({
  id: z.string().uuid(),
  slug: z.string(),
  name: z.string(),
  audience: garmentAudienceSchema,
  sortOrder: z.number().int(),
  isSystem: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const garmentTypeListQuerySchema = listQuerySchema.extend({
  limit: field(z.coerce.number().int().min(1).max(100).default(100), {
    type: "hidden",
    order: 901,
  }),
  audience: field(
    z.preprocess(
      (value) => (value === "" || value === "__any__" ? undefined : value),
      garmentAudienceSchema.optional(),
    ),
    {
      type: "select",
      label: "For",
      placeholder: "Gents and ladies",
      order: 2,
      filter: "eq",
      options: [
        { label: "Any", value: "__any__" },
        ...GARMENT_AUDIENCE_OPTIONS,
      ],
    },
  ),
});

export const paginatedGarmentTypesSchema =
  createPaginatedSchema(garmentTypeSchema);
