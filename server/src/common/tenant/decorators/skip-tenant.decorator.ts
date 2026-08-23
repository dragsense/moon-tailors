import { SetMetadata } from "@nestjs/common";

/** Skip tenant/business resolution (auth, health, docs, etc.). */
export const SKIP_TENANT_KEY = "skipTenant";
export const SkipTenant = () => SetMetadata(SKIP_TENANT_KEY, true);
