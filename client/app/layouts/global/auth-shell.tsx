import type { ReactNode } from "react";
import { Link, Outlet } from "react-router";
import { ThemeToggle } from "~/components/layout-ui/theme-toggle";
import { ROOT_ROUTE } from "~/config";
import { useBusinessTheme } from "~/features/business-theme";
import { useI18n } from "~/hooks/use-i18n";
import { cn } from "~/lib/utils";

export type AuthShellProps = {
  children: ReactNode;
  className?: string;
};

/**
 * Centered auth column — login / signup routes.
 */
export function AuthShell({ children, className }: AuthShellProps) {
  const { t } = useI18n();
  const businessTheme = useBusinessTheme();
  const title = businessTheme.title ?? t("app.name");
  const tagline = businessTheme.loginTagline ?? t("auth.signInContinue");

  return (
    <div
      className={cn(
        "relative flex min-h-screen flex-col items-center justify-center bg-muted/30 px-4 py-10",
        className,
      )}
    >
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>
      <div className="mb-8 text-center">
        <Link
          to={ROOT_ROUTE}
          className="inline-flex flex-col items-center gap-2 text-xl font-semibold tracking-tight"
        >
          {businessTheme.logoUrl ? (
            <img
              src={businessTheme.logoUrl}
              alt=""
              className="h-10 w-auto object-contain"
            />
          ) : null}
          <span>{title}</span>
        </Link>
        <p className="mt-1 text-sm text-muted-foreground">{tagline}</p>
      </div>
      <div className="w-full max-w-md">{children}</div>
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
