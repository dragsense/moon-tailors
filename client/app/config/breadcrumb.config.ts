import { ROOT_ROUTE, ROUTE_TITLES } from "./routes.config";

export type BreadcrumbItem = {
  label: string;
  href: string;
};

/** Build breadcrumb trail from pathname + `ROUTE_TITLES`. */
export function buildBreadcrumbs(pathname: string): BreadcrumbItem[] {
  if (pathname === ROOT_ROUTE) return [];

  const items: BreadcrumbItem[] = [];
  const parts = pathname.split("/").filter(Boolean);
  let current = "";

  for (const part of parts) {
    current += `/${part}`;
    const title = ROUTE_TITLES[current];
    items.push({
      label:
        title ??
        part.charAt(0).toUpperCase() + part.slice(1).replace(/-/g, " "),
      href: current,
    });
  }

  return items;
}

/** Hide breadcrumb on shallow routes (single segment). */
export function shouldShowBreadcrumbs(items: BreadcrumbItem[]): boolean {
  return items.length > 1;
}
