/**
 * Routing infrastructure only — registered from `app/routes.ts`.
 * Page UI lives in `app/pages/{public,protected}/`.
 *
 * ```txt
 * routes/
 *   guards/
 *     guest-guard.tsx       → guest-only (login)
 *     auth-guard.tsx        → session required
 *     access-guard.tsx      → level + permission check
 *     route-loading.tsx
 *
 * pages/
 *   public/                 → guest / marketing screens
 *   protected/              → signed-in app screens
 *
 * Shell layouts: layouts/global/{focus,auth,app}-shell.tsx
 * Access rules:  config/routes.config.ts
 * ```
 */
export type {};
