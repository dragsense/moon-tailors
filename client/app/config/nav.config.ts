import {
  CalendarClock,
  CreditCard,
  FolderOpen,
  KeyRound,
  LayoutDashboard,
  LayoutList,
  Mail,
  MessageSquare,
  MessagesSquare,
  Palette,
  Plus,
  Receipt,
  Settings,
  Sparkles,
  Users,
  Video,
  type LucideIcon,
} from "lucide-react";
import {
  EPermissionAction,
  EResource,
  EUserLevel,
  type IAuthUser,
} from "@template/contracts";
import type { TranslationKey } from "~/locales";
import { hasPermission } from "~/lib/permissions";
import { APP_ROUTES } from "./routes.config";

const ADMIN_LEVELS = [
  EUserLevel.PLATFORM_OWNER,
  EUserLevel.SUPER_ADMIN,
  EUserLevel.ADMIN,
] as const;

export type NavItem = {
  /** Nested i18n key — never hardcode display copy here. */
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
        icon: LayoutDashboard,
        requiredResource: EResource.DASHBOARD,
        requiredAction: EPermissionAction.READ,
      },
      {
        titleKey: "nav.items.tasks",
        url: APP_ROUTES.TASKS,
        icon: LayoutList,
        requiredResource: EResource.TASKS,
        requiredAction: EPermissionAction.READ,
      },
      {
        titleKey: "nav.items.taskCreate",
        url: APP_ROUTES.TASK_CREATE,
        icon: Plus,
        levels: [...ADMIN_LEVELS],
        requiredResource: EResource.TASKS,
        requiredAction: EPermissionAction.CREATE,
      },
      {
        titleKey: "nav.items.cameras",
        url: APP_ROUTES.CAMERAS,
        icon: Video,
        requiredResource: EResource.VIDEO_STREAM,
        requiredAction: EPermissionAction.READ,
      },
    ],
  },
  {
    groupTitleKey: "nav.groups.people",
    items: [
      {
        titleKey: "nav.items.users",
        url: APP_ROUTES.USERS,
        icon: Users,
        levels: [...ADMIN_LEVELS],
        requiredResource: EResource.USERS,
        requiredAction: EPermissionAction.READ,
      },
      {
        titleKey: "nav.items.availability",
        url: APP_ROUTES.AVAILABILITY,
        icon: CalendarClock,
        requiredResource: EResource.USER_AVAILABILITY,
        requiredAction: EPermissionAction.READ,
      },
      {
        titleKey: "nav.items.files",
        url: APP_ROUTES.FILES,
        icon: FolderOpen,
        requiredResource: EResource.FILES,
        requiredAction: EPermissionAction.READ,
      },
    ],
  },
  {
    groupTitleKey: "nav.groups.communications",
    items: [
      {
        titleKey: "nav.items.chat",
        url: APP_ROUTES.CHAT,
        icon: MessageSquare,
        requiredResource: EResource.CHAT,
        requiredAction: EPermissionAction.READ,
      },
      {
        titleKey: "nav.items.sms",
        url: APP_ROUTES.SMS,
        icon: MessagesSquare,
        levels: [...ADMIN_LEVELS],
        requiredResource: EResource.SMS,
        requiredAction: EPermissionAction.READ,
      },
      {
        titleKey: "nav.items.email",
        url: APP_ROUTES.EMAIL,
        icon: Mail,
        levels: [...ADMIN_LEVELS],
        requiredResource: EResource.EMAIL,
        requiredAction: EPermissionAction.READ,
      },
    ],
  },
  {
    groupTitleKey: "nav.groups.money",
    items: [
      {
        titleKey: "nav.items.billings",
        url: APP_ROUTES.BILLINGS,
        icon: Receipt,
        levels: [...ADMIN_LEVELS],
        requiredResource: EResource.BILLINGS,
        requiredAction: EPermissionAction.READ,
      },
      {
        titleKey: "nav.items.payments",
        url: APP_ROUTES.PAYMENTS,
        icon: CreditCard,
        levels: [...ADMIN_LEVELS],
        requiredResource: EResource.PAYMENTS,
        requiredAction: EPermissionAction.READ,
      },
      {
        titleKey: "nav.items.ai",
        url: APP_ROUTES.AI,
        icon: Sparkles,
        levels: [...ADMIN_LEVELS],
        requiredResource: EResource.AI,
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
      {
        titleKey: "nav.items.customize",
        url: APP_ROUTES.CUSTOMIZE,
        icon: Palette,
        levels: [...ADMIN_LEVELS],
        requiredResource: EResource.BUSINESSES,
        requiredAction: EPermissionAction.UPDATE,
      },
      {
        titleKey: "nav.items.apiKeys",
        url: APP_ROUTES.API_KEYS,
        icon: KeyRound,
        requiredResource: EResource.API_KEYS,
        requiredAction: EPermissionAction.READ,
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
