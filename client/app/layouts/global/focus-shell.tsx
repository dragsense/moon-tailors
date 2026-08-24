import type { ReactNode } from "react";
import { Link, Outlet } from "react-router";
import { NavTopbar } from "~/components/layout-ui";
import { ThemeToggle } from "~/components/layout-ui/theme-toggle";
import { Button } from "~/components/ui/button";
import { PUBLIC_ROUTES, ROOT_ROUTE } from "~/config";
import { cn } from "~/lib/utils";

export type FocusShellProps = {
  children: ReactNode;
  className?: string;
};

/**
 * Marketing / landing shell — top bar + centered content column.
 */
export function FocusShell({ children, className }: FocusShellProps) {
  return (
    <div className={cn("flex min-h-screen flex-col bg-background", className)}>
      <NavTopbar
        brand={
          <Link to={ROOT_ROUTE} className="font-semibold">
            Moon Tailors
          </Link>
        }
        actions={
          <>
            <ThemeToggle />
            <Button variant="ghost" size="sm" asChild>
              <Link to={PUBLIC_ROUTES.LOGIN}>Login</Link>
            </Button>
          </>
        }
      />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6">
        {children}
      </main>
    </div>
  );
}

/** Route layout — registered in `routes.ts` for public pages. */
export default function FocusShellLayout() {
  return (
    <FocusShell>
      <Outlet />
    </FocusShell>
  );
}
