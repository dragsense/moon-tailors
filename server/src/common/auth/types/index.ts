import type { EAuthMethod } from "@moon-tailors/contracts";
import type { UserEntity } from "../../base";

/** Request shape after AuthGuard attaches the user. */
export type AuthenticatedRequest = {
  method?: string;
  headers: {
    authorization?: string;
  };
  cookies?: Record<string, string | undefined>;
  user?: UserEntity;
  authMethod?: EAuthMethod;
};
