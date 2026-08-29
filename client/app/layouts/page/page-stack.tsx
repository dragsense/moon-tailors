import type { ReactNode } from "react";
import type { BreadcrumbItem } from "~/config/breadcrumb.config";
import { cn } from "~/lib/utils";
import { PageFooter } from "./footer";
import { PageHeader } from "./header";

export type PageStackProps = {
  title?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  /** Override auto breadcrumbs from the route. */
  breadcrumbItems?: BreadcrumbItem[];
  /** Replace the default header entirely. */
  header?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
};

/**
 * Simple vertical page — header, body, optional footer.
 * Use this for most list/detail/form screens.
 */
export function PageStack({
  title,
  description,
  actions,
  breadcrumbItems,
  header,
  footer,
  children,
  className,
  contentClassName,
}: PageStackProps) {
  return (
    <section className={cn("flex min-h-0 min-w-0 flex-col overflow-x-hidden gap-6 pr-1", className)}>
      <div className="shrink-0">
        {header ?? (
          <PageHeader
            title={title}
            description={description}
            actions={actions}
            breadcrumbItems={breadcrumbItems}
          />
        )}
      </div>
      <div className={cn("min-h-0 flex-1", contentClassName)}>{children}</div>
      {footer ? <PageFooter>{footer}</PageFooter> : null}
    </section>
  );
}

/** Default alias for route / op pages. */
export const Page = PageStack;
