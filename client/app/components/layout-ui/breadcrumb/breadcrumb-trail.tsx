import { Fragment } from "react";
import { Link } from "react-router";
import type { BreadcrumbItem } from "~/config/breadcrumb.config";
import {
  Breadcrumb,
  BreadcrumbItem as BreadcrumbItemSlot,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "~/components/ui/breadcrumb";

export type BreadcrumbTrailProps = {
  items: BreadcrumbItem[];
  className?: string;
};

/** Default breadcrumb — shadcn trail with chevron separators. */
export function BreadcrumbTrail({ items, className }: BreadcrumbTrailProps) {
  if (items.length === 0) return null;

  return (
    <Breadcrumb className={className}>
      <BreadcrumbList>
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <Fragment key={item.href}>
              <BreadcrumbItemSlot>
                {isLast ? (
                  <BreadcrumbPage>{item.label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link to={item.href}>{item.label}</Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItemSlot>
              {!isLast ? <BreadcrumbSeparator /> : null}
            </Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
