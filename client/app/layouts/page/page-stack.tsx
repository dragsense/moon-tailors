import type { ReactNode } from "react";
import { cn } from "~/lib/utils";
import { PageFooter } from "./footer";
import { PageHeader } from "./header";

export type PageStackProps = {
  title?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
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
  header,
  footer,
  children,
  className,
  contentClassName,
}: PageStackProps) {
  return (
    <section className={cn("flex min-h-full flex-col gap-6", className)}>
      {header ?? (
        <PageHeader title={title} description={description} actions={actions} />
      )}
      <div className={cn("min-h-0 flex-1", contentClassName)}>{children}</div>
      {footer ? <PageFooter>{footer}</PageFooter> : null}
    </section>
  );
}

/** Default alias for route / op pages. */
export const Page = PageStack;
