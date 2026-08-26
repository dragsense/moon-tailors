import type { TranslationKey } from "~/locales";
import { APP_ROUTES, ROOT_ROUTE } from "./routes.config";

export type BreadcrumbItem = {
  label: string;
  href: string;
};

const ID_SEGMENT =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const ROUTE_CRUMB_KEYS: Record<string, TranslationKey> = {
  [APP_ROUTES.ORDERS]: "nav.items.orders",
  [APP_ROUTES.PROFILE]: "nav.items.profile",
  [APP_ROUTES.RESET_PASSWORD]: "nav.items.resetPassword",
  [APP_ROUTES.SETTINGS]: "nav.items.settings",
};

type Translate = (key: TranslationKey) => string;

/**
 * Build breadcrumb trail from pathname.
 * Home is prepended by BreadcrumbCompact — never include dashboard here.
 * Never shows raw IDs.
 */
export function buildBreadcrumbs(
  pathname: string,
  t: Translate,
): BreadcrumbItem[] {
  if (pathname === ROOT_ROUTE || pathname === APP_ROUTES.DASHBOARD) {
    return [];
  }

  const items: BreadcrumbItem[] = [];
  const parts = pathname.split("/").filter(Boolean);
  let current = "";
  let resource: "customers" | "orders" | null = null;

  for (const part of parts) {
    current += `/${part}`;

    if (current === APP_ROUTES.CUSTOMERS) {
      resource = "customers";
      continue;
    }

    const knownKey = ROUTE_CRUMB_KEYS[current];
    if (knownKey) {
      items.push({ label: t(knownKey), href: current });
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
        label: t("orders.new"),
        href: current,
      });
    }
  }

  return items;
}

/** Show trail on any page that produced crumbs (Home is always added in UI). */
export function shouldShowBreadcrumbs(items: BreadcrumbItem[]): boolean {
  return items.length > 0;
}
