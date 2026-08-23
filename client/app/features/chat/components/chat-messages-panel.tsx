import type { IChatMessage } from "@template/contracts";
import { userDisplayName } from "~/features/users/api";
import { cn } from "~/lib/utils";

export type ChatMessagesPanelProps = {
  messages: IChatMessage[];
  currentUserId?: string;
  isLoading: boolean;
};

export function ChatMessagesPanel({
  messages,
  currentUserId,
  isLoading,
}: ChatMessagesPanelProps) {
  return (
    <div className="flex-1 space-y-3 overflow-y-auto p-4">
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading messages…</p>
      ) : null}
      {messages.map((message) => {
        const mine = message.senderId === currentUserId;
        return (
          <div
            key={message.id}
            className={cn("flex", mine ? "justify-end" : "justify-start")}
          >
            <div
              className={cn(
                "max-w-[80%] rounded-2xl px-3 py-2 text-sm",
                mine
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-foreground",
              )}
            >
              {!mine && message.sender ? (
                <p className="mb-1 text-xs font-medium opacity-80">
                  {userDisplayName(message.sender) || message.sender.email}
                </p>
              ) : null}
              <p className="whitespace-pre-wrap">{message.message}</p>
            </div>
          </div>
        );
      })}
      {!isLoading && messages.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground">
          No messages yet — say hello.
        </p>
      ) : null}
    </div>
  );
}
