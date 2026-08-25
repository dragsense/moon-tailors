import {
  CircleUser,
  KeyRound,
  Settings,
  type LucideIcon,
} from "lucide-react";
import {
  EPermissionAction,
  EResource,
  EUserLevel,
  type IAuthUser,
} from "@moon-tailors/contracts";
import type { TranslationKey } from "~/locales";
import { canReadResource } from "../lib/permissions";
import { APP_ROUTES } from "./routes.config";

export type NavItem = {
  titleKey: TranslationKey;
  url: string;
  icon?: LucideIcon;
  levels?: EUserLevel[];
  requiredResource?: EResource;
  requiredAction?: EPermissionAction;
  children?: NavItem[];
};

export type NavItemGroup = {
  groupTitleKey: TranslationKey;
  items: NavItem[];
};

const accountNavItems: NavItem[] = [
  {
    titleKey: "nav.items.profile",
    url: APP_ROUTES.PROFILE,
    icon: CircleUser,
  },
  {
    titleKey: "nav.items.resetPassword",
    url: APP_ROUTES.RESET_PASSWORD,
    icon: KeyRound,
  },
  {
    titleKey: "nav.items.settings",
    url: APP_ROUTES.SETTINGS,
    icon: Settings,
  },
];

/** Account links for the top-right user menu. */
export function getAccountNavItems(user?: IAuthUser | null): NavItem[] {
  return accountNavItems.filter((item) => {
    if (!item.requiredResource) return true;
    return canReadResource(user, item.requiredResource);
  });
}

export const navItemsByLevel: Record<
  EUserLevel,
  (user?: IAuthUser | null) => NavItemGroup[]
> = {
  [EUserLevel.PLATFORM_OWNER]: () => [
    { groupTitleKey: "nav.groups.account", items: accountNavItems },
  ],
  [EUserLevel.STAFF]: () => [
    { groupTitleKey: "nav.groups.account", items: accountNavItems },
  ],
  [EUserLevel.CUSTOMER]: () => [
    { groupTitleKey: "nav.groups.account", items: accountNavItems },
  ],
};

export function getNavItems(user?: IAuthUser | null): NavItemGroup[] {
  const level = user?.level ?? EUserLevel.CUSTOMER;
  return navItemsByLevel[level](user);
}
