import type { TCreateChatData, TSendChatMessageData } from "@template/contracts";
import { EPermissionAction, EResource } from "@template/contracts";
import {
  invalidateQueriesKey,
  refetchOp,
  type OpConfig,
  type OpsBag,
} from "~/ops";
import { chatService } from "../api";
import { chatKeys } from "../query-keys";

const refreshChats = (_r: unknown, _v: unknown, ops: OpsBag) => {
  refetchOp(ops, "listChats");
  refetchOp(ops, "listMessages");
  invalidateQueriesKey(chatKeys.lists());
  invalidateQueriesKey(chatKeys.messages());
};

export const chatOpsCore = {
  listChats: {
    kind: "query" as const,
    permission: { resource: EResource.CHAT, action: EPermissionAction.READ },
    initialParams: { page: 1, limit: 30 },
    queryKey: chatKeys.list,
    invalidateKey: chatKeys.lists(),
    fetch: (params: Record<string, unknown>) =>
      chatService.list({
        page: Number(params.page ?? 1),
        limit: Number(params.limit ?? 30),
        search:
          typeof params.search === "string" ? params.search : undefined,
      }),
    auto: false,
  },
  listMessages: {
    kind: "query" as const,
    permission: { resource: EResource.CHAT, action: EPermissionAction.READ },
    initialParams: { chatId: "", page: 1, limit: 50 },
    queryKey: chatKeys.messageList,
    invalidateKey: chatKeys.messages(),
    fetch: (params: Record<string, unknown>) => {
      const chatId = String(params.chatId ?? "");
      if (!chatId) {
        return Promise.resolve({ data: [], ...emptyMeta() });
      }
      return chatService.listMessages(chatId, {
        page: Number(params.page ?? 1),
        limit: Number(params.limit ?? 50),
      });
    },
    queryOptions: {
      staleTime: 0,
    },
    auto: false,
  },
  listAvailableUsers: {
    kind: "query" as const,
    permission: { resource: EResource.CHAT, action: EPermissionAction.READ },
    initialParams: { page: 1, limit: 20, search: "" },
    queryKey: chatKeys.availableUsersList,
    invalidateKey: chatKeys.availableUsers(),
    fetch: (params: Record<string, unknown>) =>
      chatService.listAvailableUsers({
        page: Number(params.page ?? 1),
        limit: Number(params.limit ?? 20),
        search:
          typeof params.search === "string" ? params.search : undefined,
      }),
    auto: false,
  },
  openChat: {
    kind: "mutation" as const,
    permission: { resource: EResource.CHAT, action: EPermissionAction.READ },
    mutate: async (vars: unknown) => vars,
    auto: false,
  },
  createChat: {
    kind: "mutation" as const,
    permission: { resource: EResource.CHAT, action: EPermissionAction.CREATE },
    mutate: (vars: unknown) => chatService.create(vars as TCreateChatData),
    onSuccess: refreshChats,
    auto: false,
  },
  sendMessage: {
    kind: "mutation" as const,
    permission: { resource: EResource.CHAT, action: EPermissionAction.CREATE },
    mutate: (vars: unknown) => {
      const { chatId, body } = vars as {
        chatId: string;
        body: TSendChatMessageData;
      };
      return chatService.sendMessage(chatId, body);
    },
    onSuccess: refreshChats,
    auto: false,
  },
} satisfies Record<string, OpConfig>;

function emptyMeta() {
  return {
    total: 0,
    page: 1,
    limit: 50,
    lastPage: 1,
    hasNextPage: false,
    hasPrevPage: false,
  };
}

export type ChatOpsCore = typeof chatOpsCore;
