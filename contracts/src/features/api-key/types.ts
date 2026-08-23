import type { z } from "zod";
import {
  apiKeyListQuerySchema,
  apiKeyListResponseSchema,
  apiKeySchema,
  createApiKeyResponseSchema,
  createApiKeySchema,
  revokeApiKeyResponseSchema,
} from "./schema.js";

export type TCreateApiKeyData = z.infer<typeof createApiKeySchema>;
export type TApiKey = z.infer<typeof apiKeySchema>;
export type TApiKeyListQuery = z.infer<typeof apiKeyListQuerySchema>;
export type TCreateApiKeyResponse = z.infer<typeof createApiKeyResponseSchema>;
export type TApiKeyListResponse = z.infer<typeof apiKeyListResponseSchema>;
export type TRevokeApiKeyResponse = z.infer<typeof revokeApiKeyResponseSchema>;
