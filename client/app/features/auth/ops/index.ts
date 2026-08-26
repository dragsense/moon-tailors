/**
 * Auth feature ops.
 *
 * ```txt
 * ops/
 *   core.ts   login op + session cache helpers (clearAuthCache, …)
 *   login.ts  / page pack
 * ```
 *
 * Session user = React Query only (`authKeys.session` + useSession hooks).
 */
export {
  authOpsCore,
  clearAuthCache,
  fetchSessionUser,
  invalidateAuthSession,
  type AppSession,
  type AuthOpsCore,
  type AuthOpName,
} from "./core";
export { loginPageOps } from "./login";
