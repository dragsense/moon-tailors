import { z } from "zod";
import { listQuerySchema } from "../../common/schema.js";
import { field } from "../../lib/field-meta.js";

/** GET /businesses query */
export const businessListQuerySchema = listQuerySchema.extend({
  isActive: field(
    z.preprocess(
      (v) => (v === "" || v === "__any__" ? undefined : v),
      z
        .enum(["true", "false"])
        .transform((v) => v === "true")
        .optional(),
    ),
    {
      type: "select",
      label: "Active",
      placeholder: "Any",
      order: 2,
      filter: "eq",
      options: [
        { label: "Any", value: "__any__" },
        { label: "Active", value: "true" },
        { label: "Inactive", value: "false" },
      ],
    },
  ),
});

export const businessSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(255),
  tenantId: z.string().uuid(),
  ownerUserId: z.string().uuid().nullable().optional(),
  /** Exactly one platform business may be true — seeded root for single-tenant. */
  isPlatform: z.boolean(),
  isActive: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const createBusinessSchema = z.object({
  name: z.string().min(1).max(255),
});
