import { Link } from "react-router";
import type { ReactNode } from "react";
import { Button, buttonVariants } from "~/components/ui/button";
import { cn } from "~/lib/utils";

export type NavItem = {
  id: string;
  label: string;
  href?: string;
  active?: boolean;
  onClick?: () => void;
};

export type NavTopbarProps = {
  brand?: ReactNode;
  items?: NavItem[];
  actions?: ReactNode;
  className?: string;
};

/** Top navigation bar. */
export function NavTopbar({
  brand,
  items = [],
  actions,
  className,
}: NavTopbarProps) {
  return (
    <header
      className={cn(
        "flex h-14 items-center justify-between gap-4 border-b bg-card px-4",
        className,
      )}
    >
      <div className="flex min-w-0 items-center gap-6">
        {brand ? <div className="shrink-0 font-semibold">{brand}</div> : null}
        {items.length > 0 ? (
          <nav className="flex items-center gap-1">
            {items.map((item) => (
              <NavLink key={item.id} item={item} />
            ))}
          </nav>
        ) : null}
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
    </header>
  );
}

export type NavTabsProps = {
  items: NavItem[];
  className?: string;
};

/** Horizontal tab-style nav. */
export function NavTabs({ items, className }: NavTabsProps) {
  return (
    <nav className={cn("flex gap-1 border-b", className)} aria-label="Tabs">
      {items.map((item) => (
        <NavTab key={item.id} item={item} tab />
      ))}
    </nav>
  );
}

function NavTab({ item, tab = false }: { item: NavItem; tab?: boolean }) {
  const className = cn(
    tab
      ? "-mb-px rounded-none border-b-2 border-transparent px-3 py-2"
      : "rounded-md px-2.5 py-1.5",
    item.active
      ? tab
        ? "border-foreground font-medium text-foreground"
        : "bg-muted font-medium text-foreground"
      : "text-muted-foreground hover:text-foreground",
    !item.active && !tab && "hover:bg-muted/50",
  );

  if (item.href) {
    return (
      <Link
        to={item.href}
        className={cn(buttonVariants({ variant: "ghost", size: "sm" }), className)}
        aria-current={item.active ? "page" : undefined}
        onClick={item.onClick}
      >
        {item.label}
      </Link>
    );
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className={className}
      aria-current={item.active ? "page" : undefined}
      onClick={item.onClick}
    >
      {item.label}
    </Button>
  );
}

function NavLink({ item }: { item: NavItem }) {
  return <NavTab item={item} />;
}
