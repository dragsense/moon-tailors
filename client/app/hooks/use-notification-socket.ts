import { useEffect } from "react";
import type { INotification } from "@template/contracts";
import { ensureSocketConnected, getSocket } from "~/lib/socket";

export type UseNotificationSocketCallbacks = {
  onNotification?: (notification: INotification) => void;
  onNotificationRead?: (notificationId: string) => void;
};

/**
 * Thin realtime helper (same idea as `useChatSocket`).
 * Data/mutations live in `features/notifications/ops`.
 */
export function useNotificationSocket({
  onNotification,
  onNotificationRead,
}: UseNotificationSocketCallbacks) {
  useEffect(() => {
    let mounted = true;

    void ensureSocketConnected().then(() => {
      if (!mounted) return;
      const socket = getSocket();

      const handleNotification = (notification: INotification) => {
        onNotification?.(notification);
      };
      const handleRead = (notificationId: string) => {
        onNotificationRead?.(notificationId);
      };

      socket.on("notification", handleNotification);
      socket.on("notificationRead", handleRead);
    });

    return () => {
      mounted = false;
      const socket = getSocket();
      socket.off("notification");
      socket.off("notificationRead");
    };
  }, [onNotification, onNotificationRead]);
}
