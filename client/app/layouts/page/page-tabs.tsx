import type { ReactNode } from "react";
import { NavTabs, type NavItem } from "~/components/layout-ui";
import { cn } from "~/lib/utils";
import { PageHeader } from "./header";

export type PageTabsProps = {
  title?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  /** Replace the default header entirely. */
  header?: ReactNode;
  tabs: NavItem[];
  children: ReactNode;
  className?: string;
  tabsClassName?: string;
  contentClassName?: string;
};

/**
 * Tabbed page — header, tabs, body. Own props; not mixed into PageStack.
 */
export function PageTabs({
  title,
  description,
  actions,
  header,
  tabs,
  children,
  className,
  tabsClassName,
  contentClassName,
}: PageTabsProps) {
  return (
    <section className={cn("flex min-h-full flex-col gap-6", className)}>
      {header ?? (
        <PageHeader title={title} description={description} actions={actions} />
      )}
      <NavTabs items={tabs} className={tabsClassName} />
      <div className={cn("min-h-0 flex-1", contentClassName)}>{children}</div>
    </section>
  );
}
