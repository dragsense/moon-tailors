import type { ReactNode } from "react";
import { Link, Outlet } from "react-router";
import { ThemeToggle } from "~/components/layout-ui/theme-toggle";
import { ROOT_ROUTE } from "~/config";
import { useI18n } from "~/hooks/use-i18n";
import { cn } from "~/lib/utils";

export type AuthShellProps = {
  children: ReactNode;
  className?: string;
};

/**
 * Centered auth column — login / password-reset routes.
 */
export function AuthShell({ children, className }: AuthShellProps) {
  const { t } = useI18n();
  const title = t("app.name");
  const tagline = t("auth.signInContinue");

  const year = new Date().getFullYear();

  return (
    <div
      className={cn(
        "relative flex min-h-screen flex-col bg-muted/30",
        className,
      )}
    >
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-10">
        <div className="mb-8 text-center">
          <Link
            to={ROOT_ROUTE}
            className="inline-flex flex-col items-center gap-2 text-xl font-semibold tracking-tight"
          >
            <span>{title}</span>
          </Link>
          <p className="mt-1 text-sm text-muted-foreground">{tagline}</p>
        </div>
        <div className="w-full max-w-md">{children}</div>
      </div>
      <footer className="border-t px-6 py-4">
        <p className="text-center text-xs text-muted-foreground">
          {t("app.copyright", { year, name: t("app.legalName") })}
        </p>
      </footer>
    </div>
  );
}

/** Route layout — registered in `routes.ts` inside guest guard. */
export default function AuthShellLayout() {
  return (
    <AuthShell>
      <Outlet />
    </AuthShell>
  );
}
