import { useCallback, useMemo, useState } from "react";
import type { IChat, IPaginatedChatMessages, IPaginatedChats } from "@template/contracts";
import { MessageSquarePlusIcon } from "lucide-react";
import { Alert } from "~/components/layout-ui";
import { Button } from "~/components/ui/button";
import { PageSplit } from "~/layouts";
import { useChatSocket } from "~/hooks";
import { useOp, type OpsStore } from "~/ops";
import { useSession } from "~/features/auth/hooks";
import { chatTitle } from "../lib/chat-display";
import { ChatComposer } from "./chat-composer";
import { ChatListPanel } from "./chat-list-panel";
import { ChatMessagesPanel } from "./chat-messages-panel";
import { NewChatDialog } from "./new-chat-dialog";

export type ChatPageProps = {
  store: OpsStore;
};

export function ChatPage({ store }: ChatPageProps) {
  const session = useSession();
  const listChats = useOp(store, "listChats");
  const listMessages = useOp(store, "listMessages");
  const openChat = useOp(store, "openChat");
  const sendMessage = useOp(store, "sendMessage");
  const createChat = useOp(store, "createChat");

  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [showNewChat, setShowNewChat] = useState(false);

  if (listChats.kind !== "query") return null;
  if (listMessages.kind !== "query") return null;
  if (openChat.kind !== "mutation") return null;
  if (sendMessage.kind !== "mutation") return null;
  if (createChat.kind !== "mutation") return null;

  const chatsPage = listChats.data as IPaginatedChats | undefined;
  const chats = chatsPage?.data ?? [];
  const messagesPage = listMessages.data as IPaginatedChatMessages | undefined;
  const messages = messagesPage?.data ?? [];

  const activeChat = useMemo(
    () => chats.find((c) => c.id === activeChatId) ?? null,
    [chats, activeChatId],
  );

  const selectChat = useCallback(
    (chat: IChat) => {
      setActiveChatId(chat.id);
      openChat.open(chat);
      listMessages.setParams({ chatId: chat.id, page: 1, limit: 50 });
    },
    [listMessages, openChat],
  );

  const refreshLists = useCallback(() => {
    void listChats.refetch();
    if (activeChatId) void listMessages.refetch();
  }, [activeChatId, listChats, listMessages]);

  useChatSocket({
    userId: session?.user.id,
    chatId: activeChatId,
    onNewChat: () => refreshLists(),
    onNewMessage: () => refreshLists(),
    onUnreadCount: () => refreshLists(),
  });

  const chatsError =
    listChats.isError && listChats.error instanceof Error
      ? listChats.error.message
      : null;

  return (
    <>
      <PageSplit
        title="Chat"
        description="Realtime messaging via reusable socket service + domain query keys."
        actions={
          createChat.allowed ? (
            <Button type="button" onClick={() => setShowNewChat(true)}>
              <MessageSquarePlusIcon className="mr-2 h-4 w-4" />
              New chat
            </Button>
          ) : null
        }
        sidebar={
          <ChatListPanel
            chats={chats}
            activeChatId={activeChatId}
            isLoading={listChats.isPending}
            onSelect={selectChat}
          />
        }
      >
        <div className="flex min-h-[480px] flex-col rounded-xl border bg-card">
          {chatsError ? (
            <div className="m-4">
              <Alert title="Couldn’t load chats" tone="danger">
                {chatsError}
              </Alert>
            </div>
          ) : null}

          {!activeChat ? (
            <div className="flex flex-1 items-center justify-center p-8 text-sm text-muted-foreground">
              Select a conversation or start a new chat.
            </div>
          ) : (
            <>
              <div className="border-b px-4 py-3">
                <p className="font-medium">
                  {chatTitle(activeChat, session?.user.id)}
                </p>
              </div>
              <ChatMessagesPanel
                messages={messages}
                currentUserId={session?.user.id}
                isLoading={listMessages.isPending}
              />
              {sendMessage.allowed ? (
                <ChatComposer
                  disabled={sendMessage.isPending}
                  onSend={async (message) => {
                    await sendMessage.run({
                      chatId: activeChat.id,
                      body: { message },
                    });
                  }}
                />
              ) : null}
            </>
          )}
        </div>
      </PageSplit>

      {showNewChat ? (
        <NewChatDialog
          store={store}
          onClose={() => setShowNewChat(false)}
          onCreated={(chat) => {
            setShowNewChat(false);
            refreshLists();
            selectChat(chat);
          }}
        />
      ) : null}
    </>
  );
}
