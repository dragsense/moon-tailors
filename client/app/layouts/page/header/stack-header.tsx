import type { ReactNode } from "react";
import { useLocation } from "react-router";
import { BreadcrumbCompact } from "~/components/layout-ui/breadcrumb";
import {
  buildBreadcrumbs,
  shouldShowBreadcrumbs,
} from "~/config/breadcrumb.config";
import { useI18n } from "~/hooks/use-i18n";
import { cn } from "~/lib/utils";

export type StackHeaderProps = {
  title?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  className?: string;
};

/** Default page header — auto breadcrumb from route config + title row. */
export function StackHeader({
  title,
  description,
  actions,
  className,
}: StackHeaderProps) {
  const location = useLocation();
  const { t } = useI18n();
  const items = buildBreadcrumbs(location.pathname, t);
  const breadcrumb = shouldShowBreadcrumbs(items) ? (
    <BreadcrumbCompact items={items} homeLabel={t("nav.items.dashboard")} />
  ) : null;

  if (!breadcrumb && !title && !description && !actions) {
    return null;
  }

  return (
    <div className={cn("space-y-3", className)}>
      {breadcrumb}
      {title || description || actions ? (
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="space-y-1">
            {title ? (
              <h1 className="font-heading text-3xl font-semibold tracking-tight">
                {title}
              </h1>
            ) : null}
            {description ? (
              <p className="text-sm text-muted-foreground">{description}</p>
            ) : null}
          </div>
          {actions ? (
            <div className="flex flex-wrap items-center gap-2">{actions}</div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

/** Default page header alias. */
export const PageHeader = StackHeader;
export type PageHeaderProps = StackHeaderProps;
