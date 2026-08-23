import { SetMetadata } from "@nestjs/common";

/** Skip response encryption for this handler/controller. */
export const SKIP_ENCRYPTION_KEY = "skipEncryption";
export const SkipEncryption = () => SetMetadata(SKIP_ENCRYPTION_KEY, true);

/**
 * Document that a route must not require CSRF (webhooks, etc.).
 * Enforcement is via `securitySkip.csrfSkipPaths` config — keep path listed there.
 */
export const SKIP_CSRF_KEY = "skipCsrf";
export const SkipCsrf = () => SetMetadata(SKIP_CSRF_KEY, true);
