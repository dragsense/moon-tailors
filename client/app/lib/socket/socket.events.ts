import type { IChat, IChatMessage, INotification } from "@template/contracts";

/** Server → client events. Extend per feature (notifications, …). */
export type ServerToClientEvents = {
  newMessage: (message: IChatMessage) => void;
  newChat: (chat: IChat) => void;
  newUnreadCount: (data: { chatId: string; unreadCount: number }) => void;
  notification: (notification: INotification) => void;
  notificationRead: (notificationId: string) => void;
};

/** Client → server events. */
export type ClientToServerEvents = {
  joinChat: (
    data: { chatId: string },
    callback?: (response: { success: boolean }) => void,
  ) => void;
  leaveChat: (
    data: { chatId: string },
    callback?: (response: { success: boolean }) => void,
  ) => void;
  joinUserRoom: (
    data: { userId: string },
    callback?: (response: { success: boolean }) => void,
  ) => void;
};

export type ChatSocketEvents = ServerToClientEvents & ClientToServerEvents;
