import type { ReactNode } from "react";
import { cn } from "~/lib/utils";

export type StackFooterProps = {
  children: ReactNode;
  className?: string;
};

/** Default page footer — actions, meta, pagination chrome. */
export function StackFooter({ children, className }: StackFooterProps) {
  return (
    <footer className={cn("border-t pt-4 text-sm text-muted-foreground", className)}>
      {children}
    </footer>
  );
}

/** Default page footer alias. */
export const PageFooter = StackFooter;
export type PageFooterProps = StackFooterProps;
