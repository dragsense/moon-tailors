import { z } from "zod";
import { listQuerySchema } from "../../common/schema.js";
import { field } from "../../lib/field-meta.js";

/** POST /api-keys body. */
export const createApiKeySchema = z.object({
  name: field(z.string().min(1).max(80), {
    type: "text",
    label: "Name",
    placeholder: "CI pipeline",
    required: true,
    order: 1,
  }),
  /** Days until expiry; omit for no expiry. */
  expiresInDays: field(z.number().int().min(1).max(3650).optional(), {
    type: "number",
    label: "Expires in (days)",
    order: 2,
  }),
  /**
   * Optional permission allowlist (`resource:action`).
   * Empty / omitted → full permissions of the owning user.
   */
  scopes: z.array(z.string().min(1)).max(64).optional(),
});

/** Public API key row (never includes the secret). */
export const apiKeySchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  /** Visible prefix for recognition, e.g. `tk_a1b2c3d4`. */
  keyPrefix: z.string(),
  scopes: z.array(z.string()).nullable(),
  lastUsedAt: z.string().datetime().nullable(),
  expiresAt: z.string().datetime().nullable(),
  revokedAt: z.string().datetime().nullable(),
  createdAt: z.string().datetime(),
});

/** Create response — plaintext `key` returned once. */
export const createApiKeyResponseSchema = z.object({
  apiKey: apiKeySchema,
  /** Full secret — store it now; it cannot be retrieved again. */
  key: z.string().min(1),
  message: z.string(),
});

export const apiKeyListResponseSchema = z.object({
  items: z.array(apiKeySchema),
});

/** GET /api-keys query */
export const apiKeyListQuerySchema = listQuerySchema;

export const revokeApiKeyResponseSchema = z.object({
  message: z.string(),
});
