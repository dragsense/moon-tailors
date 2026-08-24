import {
  ClipboardList,
  House,
  Settings,
  Users,
  type LucideIcon,
} from "lucide-react";
import {
  EPermissionAction,
  EResource,
  EUserLevel,
  type IAuthUser,
} from "@moon-tailors/contracts";
import type { TranslationKey } from "~/locales";
import { hasPermission } from "~/lib/permissions";
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

const baseNavItems: NavItemGroup[] = [
  {
    groupTitleKey: "nav.groups.work",
    items: [
      {
        titleKey: "nav.items.dashboard",
        url: APP_ROUTES.DASHBOARD,
        icon: House,
        requiredResource: EResource.DASHBOARD,
        requiredAction: EPermissionAction.READ,
      },
      {
        titleKey: "nav.items.customers",
        url: APP_ROUTES.CUSTOMERS,
        icon: Users,
        requiredResource: EResource.CUSTOMERS,
        requiredAction: EPermissionAction.READ,
      },
      {
        titleKey: "nav.items.orders",
        url: APP_ROUTES.ORDERS,
        icon: ClipboardList,
        requiredResource: EResource.ORDERS,
        requiredAction: EPermissionAction.READ,
      },
    ],
  },
  {
    groupTitleKey: "nav.groups.account",
    items: [
      {
        titleKey: "nav.items.settings",
        url: APP_ROUTES.SETTINGS,
        icon: Settings,
      },
    ],
  },
];

function filterNavItems(
  items: NavItem[],
  level: EUserLevel,
  user?: IAuthUser | null,
): NavItem[] {
  return items
    .filter((item) => {
      if (item.levels && !item.levels.includes(level)) return false;
      if (item.requiredResource) {
        return hasPermission(user, item.requiredResource, [
          item.requiredAction ?? EPermissionAction.READ,
          EPermissionAction.MANAGE,
        ]);
      }
      return true;
    })
    .map((item) => ({
      ...item,
      children: item.children
        ? filterNavItems(item.children, level, user)
        : undefined,
    }));
}

function buildNavItemsForLevel(
  level: EUserLevel,
  user?: IAuthUser | null,
): NavItemGroup[] {
  return baseNavItems
    .map((group) => ({
      ...group,
      items: filterNavItems(group.items, level, user),
    }))
    .filter((group) => group.items.length > 0);
}

export const navItemsByLevel: Record<
  EUserLevel,
  (user?: IAuthUser | null) => NavItemGroup[]
> = {
  [EUserLevel.PLATFORM_OWNER]: (user) =>
    buildNavItemsForLevel(EUserLevel.PLATFORM_OWNER, user),
  [EUserLevel.SUPER_ADMIN]: (user) =>
    buildNavItemsForLevel(EUserLevel.SUPER_ADMIN, user),
  [EUserLevel.ADMIN]: (user) => buildNavItemsForLevel(EUserLevel.ADMIN, user),
  [EUserLevel.STAFF]: (user) => buildNavItemsForLevel(EUserLevel.STAFF, user),
  [EUserLevel.MEMBER]: (user) =>
    buildNavItemsForLevel(EUserLevel.MEMBER, user),
};

export function getNavItems(user?: IAuthUser | null): NavItemGroup[] {
  const level = user?.level ?? EUserLevel.MEMBER;
  return navItemsByLevel[level](user);
}
