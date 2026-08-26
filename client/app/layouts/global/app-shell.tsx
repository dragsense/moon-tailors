import type { ReactNode } from "react";
import { Link, Outlet } from "react-router";
import type { IAuthUser } from "@moon-tailors/contracts";
import { GlobalHeader, UserMenu } from "./header";
import { ThemeToggle } from "~/components/layout-ui/theme-toggle";
import { LanguageToggle } from "~/components/layout-ui/language-toggle";
import { APP_ROUTES } from "~/config";
import { useSession } from "~/features/auth/hooks";
import { useI18n } from "~/hooks/use-i18n";
import { cn } from "~/lib/utils";
import { AppFooter } from "./footer";

export type AppShellProps = {
  user: IAuthUser;
  children: ReactNode;
  className?: string;
};

/**
 * Authenticated shell — top bar with brand, theme, and account menu.
 */
export function AppShell({
  user,
  children,
  className,
}: AppShellProps) {
  const { t } = useI18n();
  const appName = t("app.name");
  const year = new Date().getFullYear();

  return (
    <div
      className={cn(
        "flex min-h-0 flex-1 flex-col overflow-hidden",
        className,
      )}
    >
      <GlobalHeader
        className="sticky top-0 z-20 shrink-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80"
        start={
          <Link
            to={APP_ROUTES.DASHBOARD}
            className="flex min-w-0 items-center gap-2"
          >
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-sm font-semibold text-primary-foreground">
              {t("app.initial")}
            </span>
            <span className="hidden truncate font-semibold sm:block">
              {appName}
            </span>
          </Link>
        }
        actions={
          <>
            <LanguageToggle />
            <ThemeToggle />
            <UserMenu user={user} />
          </>
        }
      />
      <main className="min-h-0 flex-1 overflow-auto p-6">{children}</main>
      <AppFooter className="px-6 py-4">
        <p className="text-center text-xs text-muted-foreground">
          {t("app.copyright", { year, name: t("app.legalName") })}
        </p>
      </AppFooter>
    </div>
  );
}

/** Route layout — registered in `routes.ts` after auth/access guards. */
export default function AppShellLayout() {
  const session = useSession();

  if (!session) {
    return null;
  }

  return (
    <AppShell user={session.user}>
      <Outlet />
    </AppShell>
  );
}
