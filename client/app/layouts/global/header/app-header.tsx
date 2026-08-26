import type { ReactNode } from "react";
import { cn } from "~/lib/utils";

export type AppHeaderProps = {
  start?: ReactNode;
  title?: ReactNode;
  actions?: ReactNode;
  className?: string;
};

/** Default app-shell top bar — brand and actions. */
export function AppHeader({
  start,
  title,
  actions,
  className,
}: AppHeaderProps) {
  return (
    <header
      className={cn(
        "flex h-14 shrink-0 items-center gap-2 border-b bg-background px-4",
        className,
      )}
    >
      {start}
      {title ? (
        <h1 className="truncate text-sm font-medium">{title}</h1>
      ) : null}
      {actions ? (
        <div className="ms-auto flex items-center gap-2">{actions}</div>
      ) : null}
    </header>
  );
}

/** Default global header alias. */
export const GlobalHeader = AppHeader;
export type GlobalHeaderProps = AppHeaderProps;
