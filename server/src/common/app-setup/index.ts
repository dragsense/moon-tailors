/**
 * Application HTTP startup helpers (formerly `bootstrap`).
 * Security → `common/security`, OpenAPI → `common/docs`.
 */
export { setupMiddleware } from "./middleware.setup";
export { setupStaticAssets } from "./static-assets.setup";
export { handleStartupError } from "./startup-error.handler";
