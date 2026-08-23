/**
 * Contracts package — shared Zod schemas, types, interfaces, and helpers
 * for backend + frontend.
 *
 * Layout:
 *
 *   common/     pagination, message, list query base
 *   features/   auth, user, task (enum + schema + types + interfaces)
 *   lib/        field(), format, dates, pagination helpers
 */
export * from "./lib/index.js";
export * from "./common/index.js";
export * from "./features/index.js";
