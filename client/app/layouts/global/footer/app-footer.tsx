import type { ReactNode } from "react";
import { cn } from "~/lib/utils";

export type AppFooterProps = {
  children?: ReactNode;
  className?: string;
};

/** Default app-shell footer — optional chrome under main content. */
export function AppFooter({ children, className }: AppFooterProps) {
  if (!children) return null;

  return (
    <footer
      className={cn(
        "shrink-0 border-t bg-background px-4 py-3 text-sm text-muted-foreground",
        className,
      )}
    >
      {children}
    </footer>
  );
}

/** Default global footer alias. */
export const GlobalFooter = AppFooter;
export type GlobalFooterProps = AppFooterProps;
