import {
  EPermissionAction,
  EResource,
} from "@template/contracts";
import {
  invalidateQueriesKey,
  refetchOp,
  type OpConfig,
  type OpsBag,
} from "~/ops";
import { notificationsService } from "../api";

export const notificationKeys = {
  all: ["notifications"] as const,
  list: (params: Record<string, unknown> = {}) =>
    [...notificationKeys.all, "list", params] as const,
  lists: () => [...notificationKeys.all, "list"] as const,
  unread: () => [...notificationKeys.all, "unread-count"] as const,
};

const refreshNotifications = (_r: unknown, _v: unknown, ops: OpsBag) => {
  refetchOp(ops, "listNotifications");
  refetchOp(ops, "unreadCount");
  invalidateQueriesKey(notificationKeys.all);
};

export const notificationsOpsCore = {
  listNotifications: {
    kind: "query" as const,
    permission: {
      resource: EResource.NOTIFICATIONS,
      action: EPermissionAction.READ,
    },
    initialParams: { page: 1, limit: 20 },
    queryKey: notificationKeys.list,
    invalidateKey: notificationKeys.lists(),
    fetch: (params: Record<string, unknown>) =>
      notificationsService.list({
        page: Number(params.page ?? 1),
        limit: Number(params.limit ?? 20),
        unreadOnly: Boolean(params.unreadOnly),
      }),
    queryOptions: {
      staleTime: 30_000,
    },
  },
  unreadCount: {
    kind: "query" as const,
    permission: {
      resource: EResource.NOTIFICATIONS,
      action: EPermissionAction.READ,
    },
    queryKey: () => notificationKeys.unread(),
    invalidateKey: notificationKeys.unread(),
    fetch: () => notificationsService.unreadCount(),
    queryOptions: {
      staleTime: 30_000,
    },
  },
  markRead: {
    kind: "mutation" as const,
    permission: {
      resource: EResource.NOTIFICATIONS,
      action: EPermissionAction.UPDATE,
    },
    mutate: (vars: unknown) =>
      notificationsService.markRead(String((vars as { id: string }).id)),
    onSuccess: refreshNotifications,
  },
  markAllRead: {
    kind: "mutation" as const,
    permission: {
      resource: EResource.NOTIFICATIONS,
      action: EPermissionAction.UPDATE,
    },
    mutate: () => notificationsService.markAllRead(),
    onSuccess: refreshNotifications,
  },
  deleteNotification: {
    kind: "mutation" as const,
    permission: {
      resource: EResource.NOTIFICATIONS,
      action: EPermissionAction.DELETE,
    },
    mutate: (vars: unknown) =>
      notificationsService.remove(String((vars as { id: string }).id)),
    onSuccess: refreshNotifications,
  },
} satisfies Record<string, OpConfig>;
