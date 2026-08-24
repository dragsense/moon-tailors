import type { EAuthMethod } from "@moon-tailors/contracts";
import type { UserEntity } from "../../base";

/** Request shape after AuthGuard attaches the user / API-key context. */
export type AuthenticatedRequest = {
  method?: string;
  headers: {
    authorization?: string;
    "x-api-key"?: string;
  };
  user?: UserEntity;
  authMethod?: EAuthMethod;
  /** When authMethod is API_KEY and scopes are set. */
  apiKeyScopes?: string[] | null;
  apiKeyId?: string;
};
