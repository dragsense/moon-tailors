import type { ApiKeyEntity } from "../entities/api-key.entity";

/** Result of resolving a raw API key secret (AuthGuard). */
export type ResolvedApiKey = {
  entity: ApiKeyEntity;
  userId: string;
  scopes: string[] | null;
};
