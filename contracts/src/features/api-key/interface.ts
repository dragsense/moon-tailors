import type { z } from "zod";
import {
  apiKeyListResponseSchema,
  apiKeySchema,
  createApiKeyResponseSchema,
} from "./schema.js";

export interface IApiKey extends z.infer<typeof apiKeySchema> {}
export interface ICreateApiKeyResponse
  extends z.infer<typeof createApiKeyResponseSchema> {}
export interface IApiKeyListResponse
  extends z.infer<typeof apiKeyListResponseSchema> {}
