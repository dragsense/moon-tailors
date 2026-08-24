import { ChevronDownIcon, LogOutIcon } from "lucide-react";
import type { IAuthUser } from "@moon-tailors/contracts";
import { Avatar, AvatarFallback } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { useI18n } from "~/hooks/use-i18n";
import { useLogout } from "~/features/auth/hooks";
import { APP_ROUTES } from "~/config";
import { Link } from "react-router";
import { cn } from "~/lib/utils";

export type UserMenuProps = {
  user: IAuthUser;
  className?: string;
};

/** Top-right account menu — profile, settings, and logout. */
export function UserMenu({ user, className }: UserMenuProps) {
  const { t, alignEnd } = useI18n();
  const { logout, isLoading } = useLogout();
  const fullName = `${user.firstName} ${user.lastName}`.trim();
  const initials =
    `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          disabled={isLoading}
          className={cn(
            "flex h-auto items-center gap-2 px-2 py-1.5",
            className,
          )}
        >
          <Avatar className="size-8 rounded-lg">
            <AvatarFallback className="rounded-lg text-xs">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="hidden min-w-0 text-start md:block">
            <div className="truncate text-sm font-medium leading-tight">
              {fullName}
            </div>
            <div className="truncate text-xs text-muted-foreground leading-tight">
              {user.email}
            </div>
          </div>
          <ChevronDownIcon className="size-3.5 opacity-60" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={alignEnd} className="w-64" sideOffset={8}>
        <div className="flex items-center gap-3 px-2 py-2 md:hidden">
          <Avatar className="size-9 rounded-lg">
            <AvatarFallback className="rounded-lg text-xs">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-medium">{fullName}</div>
            <div className="truncate text-xs text-muted-foreground">
              {user.email}
            </div>
          </div>
        </div>
        <DropdownMenuSeparator className="md:hidden" />
        <DropdownMenuItem asChild>
          <Link to={APP_ROUTES.PROFILE}>{t("nav.items.profile")}</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to={APP_ROUTES.SETTINGS}>{t("nav.items.settings")}</Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          disabled={isLoading}
          onClick={() => void logout()}
        >
          <LogOutIcon className="size-4" />
          {t("auth.logOut")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
