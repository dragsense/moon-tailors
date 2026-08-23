import { useEffect } from "react";
import type { IChat, IChatMessage } from "@template/contracts";
import { ensureSocketConnected, getSocket, socketEmit } from "~/lib/socket";

export type UseChatSocketCallbacks = {
  userId?: string | null;
  chatId?: string | null;
  onNewChat?: (chat: IChat) => void;
  onNewMessage?: (message: IChatMessage) => void;
  onUnreadCount?: (data: { chatId: string; unreadCount: number }) => void;
};

/**
 * Reusable chat realtime hook* Joins user + chat rooms; subscribe only to callbacks you need.
 */
export function useChatSocket({
  userId,
  chatId,
  onNewChat,
  onNewMessage,
  onUnreadCount,
}: UseChatSocketCallbacks) {
  useEffect(() => {
    if (!userId) return;

    void ensureSocketConnected().then(() => {
      void socketEmit("joinUserRoom", { userId });
    });
  }, [userId]);

  useEffect(() => {
    if (!chatId) return;

    void ensureSocketConnected().then(() => {
      void socketEmit("joinChat", { chatId });
    });

    return () => {
      void socketEmit("leaveChat", { chatId });
    };
  }, [chatId]);

  useEffect(() => {
    if (!onNewChat) return;
    const socket = getSocket();
    const handler = (chat: IChat) => onNewChat(chat);
    socket.on("newChat", handler);
    return () => {
      socket.off("newChat", handler);
    };
  }, [onNewChat]);

  useEffect(() => {
    if (!onNewMessage) return;
    const socket = getSocket();
    const handler = (message: IChatMessage) => onNewMessage(message);
    socket.on("newMessage", handler);
    return () => {
      socket.off("newMessage", handler);
    };
  }, [onNewMessage]);

  useEffect(() => {
    if (!onUnreadCount) return;
    const socket = getSocket();
    const handler = (data: { chatId: string; unreadCount: number }) =>
      onUnreadCount(data);
    socket.on("newUnreadCount", handler);
    return () => {
      socket.off("newUnreadCount", handler);
    };
  }, [onUnreadCount]);
}
