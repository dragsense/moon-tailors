import type { IChat } from "@template/contracts";
import { cn } from "~/lib/utils";
import { chatTitle } from "../lib/chat-display";

export type ChatListPanelProps = {
  chats: IChat[];
  activeChatId: string | null;
  isLoading: boolean;
  onSelect: (chat: IChat) => void;
};

export function ChatListPanel({
  chats,
  activeChatId,
  isLoading,
  onSelect,
}: ChatListPanelProps) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">Conversations</p>
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : null}
      <ul className="space-y-1">
        {chats.map((chat) => {
          const title = chatTitle(chat);
          const preview = chat.lastMessage?.message ?? "No messages yet";
          const active = chat.id === activeChatId;

          return (
            <li key={chat.id}>
              <button
                type="button"
                onClick={() => onSelect(chat)}
                className={cn(
                  "w-full rounded-lg border px-3 py-2 text-left text-sm transition-colors hover:bg-muted/50",
                  active && "border-primary bg-muted/40",
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate font-medium">{title}</span>
                  {chat.unreadCount > 0 ? (
                    <span className="rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
                      {chat.unreadCount}
                    </span>
                  ) : null}
                </div>
                <p className="mt-1 truncate text-xs text-muted-foreground">
                  {preview}
                </p>
              </button>
            </li>
          );
        })}
      </ul>
      {!isLoading && chats.length === 0 ? (
        <p className="text-sm text-muted-foreground">No chats yet.</p>
      ) : null}
    </div>
  );
}
