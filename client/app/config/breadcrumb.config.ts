import type { TranslationKey } from "~/locales";
import { APP_ROUTES, ROOT_ROUTE } from "./routes.config";

export type BreadcrumbItem = {
  label: string;
  href: string;
};

const ID_SEGMENT =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const ROUTE_CRUMB_KEYS: Record<string, TranslationKey> = {
  [APP_ROUTES.DASHBOARD]: "nav.items.dashboard",
  [APP_ROUTES.CUSTOMERS]: "nav.items.customers",
  [APP_ROUTES.ORDERS]: "nav.items.orders",
  [APP_ROUTES.PROFILE]: "nav.items.profile",
  [APP_ROUTES.RESET_PASSWORD]: "nav.items.resetPassword",
  [APP_ROUTES.SETTINGS]: "nav.items.settings",
};

type Translate = (key: TranslationKey) => string;

/** Build breadcrumb trail from pathname. Never shows raw IDs. */
export function buildBreadcrumbs(
  pathname: string,
  t: Translate,
): BreadcrumbItem[] {
  if (pathname === ROOT_ROUTE) return [];

  const items: BreadcrumbItem[] = [];
  const parts = pathname.split("/").filter(Boolean);
  let current = "";
  let resource: "customers" | "orders" | null = null;

  for (const part of parts) {
    current += `/${part}`;
    const knownKey = ROUTE_CRUMB_KEYS[current];
    if (knownKey) {
      items.push({ label: t(knownKey), href: current });
      if (current === APP_ROUTES.CUSTOMERS) resource = "customers";
      if (current === APP_ROUTES.ORDERS) resource = "orders";
      continue;
    }

    if (ID_SEGMENT.test(part)) {
      items.push({
        label:
          resource === "orders" ? t("orders.profile") : t("customers.profile"),
        href: current,
      });
      continue;
    }

    if (part === "new") {
      items.push({
        label: resource === "customers" ? t("orders.new") : t("customers.new"),
        href: current,
      });
    }
  }

  return items;
}

/** Hide breadcrumb on shallow routes (single segment). */
export function shouldShowBreadcrumbs(items: BreadcrumbItem[]): boolean {
  return items.length > 1;
}
