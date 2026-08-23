import type { ReactNode } from "react";
import { Outlet, useLocation } from "react-router";
import type { IAuthUser } from "@template/contracts";
import { GlobalHeader, UserMenu } from "./header";
import { NotificationBell } from "./notification-bell";
import { AppSidebar } from "~/components/layout-ui/sidebar/app-sidebar";
import { ThemeToggle } from "~/components/layout-ui/theme-toggle";
import { Separator } from "~/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "~/components/ui/sidebar";
import { getRouteTitle } from "~/config";
import { useSession } from "~/features/auth/hooks";
import { useBusinessTheme } from "~/features/business-theme";
import { notificationsOps } from "~/features/notifications";
import { TimezoneSelect } from "~/features/settings";
import { useI18n } from "~/hooks/use-i18n";
import { OpsProvider } from "~/ops";
import { cn } from "~/lib/utils";

export type AppShellProps = {
  user: IAuthUser;
  children: ReactNode;
  className?: string;
  /** Show timezone picker in the header (omit for apps that only use device TZ). */
  showTimezoneSelect?: boolean;
};

/**
 * Authenticated shell with shadcn Sidebar (collapsible + mobile sheet).
 * Nav comes from `config/nav.config.ts`.
 */
export function AppShell({
  user,
  children,
  className,
  showTimezoneSelect = true,
}: AppShellProps) {
  const location = useLocation();
  const { t } = useI18n();
  const businessTheme = useBusinessTheme();
  const title = getRouteTitle(location.pathname);
  const appName = businessTheme.title ?? t("app.name");
  const year = new Date().getFullYear();
  const compact = businessTheme.density === "compact";

  return (
    <OpsProvider store={notificationsOps}>
      {() => (
        <SidebarProvider className="min-h-0 flex-1 overflow-hidden">
          <AppSidebar user={user} />
          <SidebarInset
            className={cn(
              "flex min-h-0 flex-1 flex-col overflow-hidden",
              className,
            )}
          >
            <GlobalHeader
              className="sticky top-0 z-20 shrink-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80"
              start={
                <>
                  <SidebarTrigger />
                  <Separator orientation="vertical" className="me-2 h-4" />
                </>
              }
              title={title ?? appName}
              actions={
                <>
                  {showTimezoneSelect ? (
                    <TimezoneSelect
                      variant="compact"
                      className="hidden sm:flex"
                    />
                  ) : null}
                  <NotificationBell />
                  <ThemeToggle />
                  <UserMenu user={user} />
                </>
              }
            />
            <main
              className={cn(
                "min-h-0 flex-1 overflow-auto",
                compact ? "p-3" : "p-6",
              )}
            >
              {children}
            </main>
            <footer className="shrink-0 border-t px-6 py-4">
              <div className="flex flex-col gap-1 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
                <span className="font-medium text-foreground/80">{appName}</span>
                <span>{t("app.copyright", { year, name: appName })}</span>
              </div>
            </footer>
          </SidebarInset>
        </SidebarProvider>
      )}
    </OpsProvider>
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
