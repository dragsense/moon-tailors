import { useCallback } from "react";
import { BellIcon } from "lucide-react";
import type { INotification, IPaginatedNotifications } from "@template/contracts";
import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { useI18n } from "~/hooks/use-i18n";
import { useNotificationSocket } from "~/hooks/use-notification-socket";
import { useOp } from "~/ops";
import { notificationsOps } from "~/features/notifications";
import { resolvePreferences, settingsOps } from "~/features/settings";
import { cn } from "~/lib/utils";

export function NotificationBell() {
  const { t } = useI18n();
  const mySettings = useOp(settingsOps, "mySettings");
  const preferences = resolvePreferences(
    mySettings.kind === "query" ? mySettings.data : undefined,
  );

  const listOp = useOp(notificationsOps, "listNotifications");
  const unreadOp = useOp(notificationsOps, "unreadCount");
  const markReadOp = useOp(notificationsOps, "markRead");
  const markAllReadOp = useOp(notificationsOps, "markAllRead");

  const notifications: INotification[] =
    listOp.kind === "query"
      ? ((listOp.data as IPaginatedNotifications | undefined)?.data ?? [])
      : [];
  const unreadCount =
    unreadOp.kind === "query"
      ? ((unreadOp.data as { count?: number } | undefined)?.count ?? 0)
      : 0;
  const isLoading = listOp.kind === "query" && listOp.isPending;

  const refresh = useCallback(() => {
    if (listOp.kind === "query") void listOp.refetch();
    if (unreadOp.kind === "query") void unreadOp.refetch();
  }, [listOp, unreadOp]);

  useNotificationSocket({
    onNotification: refresh,
    onNotificationRead: refresh,
  });

  if (!preferences.notifications.bellEnabled) return null;
  if (!preferences.notifications.inAppEnabled) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button" variant="ghost" size="icon" className="relative">
          <BellIcon className="h-4 w-4" />
          {unreadCount > 0 ? (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] text-primary-foreground">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          ) : null}
          <span className="sr-only">{t("notifications.title")}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>{t("notifications.title")}</span>
          {unreadCount > 0 && markAllReadOp.kind === "mutation" ? (
            <button
              type="button"
              className="text-xs font-normal text-primary"
              onClick={() => void markAllReadOp.run(undefined)}
            >
              {t("common.actions.markAllRead")}
            </button>
          ) : null}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {isLoading ? (
          <DropdownMenuItem disabled>
            {t("notifications.loading")}
          </DropdownMenuItem>
        ) : notifications.length === 0 ? (
          <DropdownMenuItem disabled>
            {t("notifications.empty")}
          </DropdownMenuItem>
        ) : (
          notifications.slice(0, 8).map((item) => (
            <DropdownMenuItem
              key={item.id}
              className={cn(
                "flex cursor-pointer flex-col items-start gap-1 py-2",
                !item.isRead && "bg-muted/40",
              )}
              onClick={() => {
                if (
                  !item.isRead &&
                  markReadOp.kind === "mutation"
                ) {
                  void markReadOp.run({ id: item.id });
                }
              }}
            >
              <span className="text-sm font-medium">{item.title}</span>
              <span className="line-clamp-2 text-xs text-muted-foreground">
                {item.message}
              </span>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
