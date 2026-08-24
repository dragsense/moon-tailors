import { Link, useLocation } from "react-router";
import { LogOutIcon } from "lucide-react";
import { EUserLevel, type IAuthUser } from "@moon-tailors/contracts";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "~/components/ui/sidebar";
import { Avatar, AvatarFallback } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import { getNavItems, ROOT_ROUTE } from "~/config";
import { useLogout } from "~/features/auth/hooks";
import { useI18n } from "~/hooks/use-i18n";

export type AppSidebarProps = {
  user: IAuthUser;
};

/**
 * Collapsible shadcn sidebar — see https://ui.shadcn.com/docs/components/base/sidebar
 */
export function AppSidebar({ user }: AppSidebarProps) {
  const location = useLocation();
  const { t, dir, sidebarSide } = useI18n();
  const { logout, isLoading } = useLogout();
  const navGroups = getNavItems(user);
  const initials =
    `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
  const brandTitle = t("app.name");
  const brandTagline = t("app.tagline");

  return (
    <Sidebar collapsible="icon" side={sidebarSide} dir={dir}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link to={ROOT_ROUTE}>
                <div className="flex aspect-square size-8 items-center justify-center overflow-hidden rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <span className="text-sm font-semibold">
                    {(brandTitle.charAt(0) || t("app.initial")).toUpperCase()}
                  </span>
                </div>
                <div className="grid flex-1 text-start text-sm leading-tight">
                  <span className="truncate font-semibold">{brandTitle}</span>
                  <span className="truncate text-xs text-muted-foreground">
                    {brandTagline}
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {navGroups.map((group) => (
          <SidebarGroup key={group.groupTitleKey}>
            <SidebarGroupLabel>{t(group.groupTitleKey)}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const title = t(item.titleKey);
                  return (
                    <SidebarMenuItem key={item.url}>
                      <SidebarMenuButton
                        asChild
                        isActive={location.pathname === item.url}
                        tooltip={title}
                      >
                        <Link to={item.url}>
                          {Icon ? <Icon /> : null}
                          <span>{title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              className="cursor-default hover:bg-transparent"
            >
              <Avatar className="size-8 rounded-lg">
                <AvatarFallback className="rounded-lg">{initials}</AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-start text-sm leading-tight">
                <span className="truncate font-medium">
                  {user.firstName} {user.lastName}
                </span>
                <span className="truncate text-xs text-muted-foreground">
                  {user.email}
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <p className="px-2 text-xs uppercase tracking-wide text-muted-foreground">
              {EUserLevel[user.level].replaceAll("_", " ")}
            </p>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isLoading}
              className="w-full justify-start gap-2"
              onClick={() => void logout()}
            >
              <LogOutIcon className="size-4" />
              {isLoading ? t("auth.loggingOut") : t("auth.logOut")}
            </Button>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
