import type { ReactNode } from "react";
import { cn } from "~/lib/utils";
import { PageFooter } from "./footer";
import { PageHeader } from "./header";

export type PageSplitProps = {
  title?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  /** Replace the default header entirely. */
  header?: ReactNode;
  /** Fixed-width column (list, nav, filters). */
  sidebar: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
  sidebarClassName?: string;
  contentClassName?: string;
};

/**
 * Two-column page — sidebar + main. Own props; not mixed into PageStack.
 * Use for chat, inbox, master-detail, etc.
 */
export function PageSplit({
  title,
  description,
  actions,
  header,
  sidebar,
  children,
  footer,
  className,
  sidebarClassName,
  contentClassName,
}: PageSplitProps) {
  return (
    <section className={cn("flex min-h-full flex-col gap-6", className)}>
      {header ?? (
        <PageHeader title={title} description={description} actions={actions} />
      )}

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-6 lg:grid-cols-[minmax(0,280px)_minmax(0,1fr)]">
        <aside className={cn("min-w-0", sidebarClassName)}>{sidebar}</aside>
        <div className={cn("min-w-0", contentClassName)}>{children}</div>
      </div>

      {footer ? <PageFooter>{footer}</PageFooter> : null}
    </section>
  );
}
