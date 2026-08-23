import { AppLoader } from "~/components/layout-ui";

/**
 * Session-resolving fallback — no useI18n here.
 * Auth guards can render before/outside App providers during hydrate.
 */
export function RouteLoading() {
  return <AppLoader />;
}
