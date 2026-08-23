import type { ReactNode } from "react";
import { Link } from "react-router";
import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";

export type SidebarLink = {
  id: string;
  label: string;
  href?: string;
  icon?: ReactNode;
  active?: boolean;
  onClick?: () => void;
};

export type SidebarRailProps = {
  items: SidebarLink[];
  footer?: ReactNode;
  className?: string;
  brand?: ReactNode;
};

/** Compact icon rail sidebar. */
export function SidebarRail({
  items,
  footer,
  className,
  brand,
}: SidebarRailProps) {
  return (
    <aside
      className={cn(
        "flex h-full w-14 flex-col items-center border-r bg-card py-3",
        className,
      )}
    >
      {brand ? <div className="mb-4 px-1">{brand}</div> : null}
      <nav className="flex flex-1 flex-col items-center gap-1">
        {items.map((item) => (
          <SidebarItem key={item.id} item={item} variant="rail" />
        ))}
      </nav>
      {footer ? <div className="mt-auto pt-3">{footer}</div> : null}
    </aside>
  );
}

export type SidebarNavGroup = {
  id: string;
  label?: string;
  items: SidebarLink[];
};

export type SidebarPanelProps = {
  items?: SidebarLink[];
  groups?: SidebarNavGroup[];
  footer?: ReactNode;
  className?: string;
  brand?: ReactNode;
  title?: string;
};

/** Labeled panel sidebar with optional grouped sections. */
export function SidebarPanel({
  items,
  groups,
  footer,
  className,
  brand,
  title,
}: SidebarPanelProps) {
  const sections: SidebarNavGroup[] =
    groups ?? (items ? [{ id: "default", items }] : []);

  return (
    <aside
      className={cn(
        "flex h-full w-56 flex-col border-r bg-card px-3 py-4",
        className,
      )}
    >
      {(brand || title) && (
        <div className="mb-4 space-y-1 px-2">
          {brand}
          {title ? (
            <p className="text-sm font-semibold tracking-tight">{title}</p>
          ) : null}
        </div>
      )}
      <nav className="flex flex-1 flex-col gap-4">
        {sections.map((section) => (
          <div key={section.id} className="flex flex-col gap-0.5">
            {section.label ? (
              <p className="px-2.5 pb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {section.label}
              </p>
            ) : null}
            {section.items.map((item) => (
              <SidebarItem key={item.id} item={item} variant="panel" />
            ))}
          </div>
        ))}
      </nav>
      {footer ? <div className="mt-auto border-t pt-3">{footer}</div> : null}
    </aside>
  );
}

function SidebarItem({
  item,
  variant,
}: {
  item: SidebarLink;
  variant: "rail" | "panel";
}) {
  const className = cn(
    variant === "rail" && "size-9 justify-center px-0",
    variant === "panel" && "h-auto w-full justify-start px-2.5 py-2",
    item.active && "bg-muted font-medium text-foreground",
  );

  if (item.href) {
    return (
      <Button
        variant="ghost"
        size={variant === "rail" ? "icon-sm" : "sm"}
        className={className}
        asChild
      >
        <Link
          to={item.href}
          aria-current={item.active ? "page" : undefined}
          title={item.label}
          onClick={item.onClick}
        >
          {item.icon}
          {variant === "panel" ? <span>{item.label}</span> : null}
          {variant === "rail" ? <span className="sr-only">{item.label}</span> : null}
        </Link>
      </Button>
    );
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size={variant === "rail" ? "icon-sm" : "sm"}
      className={className}
      title={item.label}
      onClick={item.onClick}
      aria-current={item.active ? "page" : undefined}
    >
      {item.icon}
      {variant === "panel" ? <span>{item.label}</span> : null}
      {variant === "rail" ? <span className="sr-only">{item.label}</span> : null}
    </Button>
  );
}
