import { Link } from "react-router";
import { ChevronRightIcon, HomeIcon } from "lucide-react";
import type { BreadcrumbItem } from "~/config/breadcrumb.config";
import { ROOT_ROUTE } from "~/config";

export type BreadcrumbCompactProps = {
  items: BreadcrumbItem[];
  homeHref?: string;
  homeLabel?: string;
  className?: string;
};

/**
 * Compact breadcrumb* Home icon + chevron-separated links.
 */
export function BreadcrumbCompact({
  items,
  homeHref = ROOT_ROUTE,
  homeLabel = "Home",
  className,
}: BreadcrumbCompactProps) {
  if (items.length === 0) return null;

  const trail = [{ label: homeLabel, href: homeHref }, ...items];

  return (
    <nav
      className={`flex flex-wrap items-center gap-2 text-sm text-muted-foreground ${className ?? ""}`}
      aria-label="Breadcrumb"
    >
      {trail.map((item, index) => {
        const isLast = index === trail.length - 1;
        const isHome = index === 0;

        return (
          <div key={`${item.href}-${index}`} className="flex items-center gap-2">
            {index > 0 ? <ChevronRightIcon className="h-4 w-4 shrink-0" /> : null}
            {isLast ? (
              <span className="font-medium text-foreground">{item.label}</span>
            ) : isHome ? (
              <Link
                to={item.href}
                className="transition-colors hover:text-foreground"
                aria-label={item.label}
              >
                <HomeIcon className="h-4 w-4" />
              </Link>
            ) : (
              <Link
                to={item.href}
                className="transition-colors hover:text-foreground"
              >
                {item.label}
              </Link>
            )}
          </div>
        );
      })}
    </nav>
  );
}
