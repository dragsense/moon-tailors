import type {
  IChat,
  IChatMessage,
  IPaginatedChatMessages,
  IPaginatedChats,
  IPaginatedResponse,
  TChatListQuery,
  TCreateChatData,
  TCreateChatResponse,
  TSendChatMessageData,
  TUserListQuery,
} from "@template/contracts";
import { BaseService } from "~/lib/api";
import type { TUserRow } from "~/features/users/api";

class ChatService extends BaseService<
  IChat,
  TCreateChatData | TSendChatMessageData
> {
  constructor() {
    super("/chat");
  }

  list(query: Partial<TChatListQuery> = {}) {
    const { page = 1, limit = 20, ...rest } = query;
    return this.get<IChat>({
      page,
      limit,
      ...rest,
    }) as unknown as Promise<IPaginatedChats>;
  }

  listAvailableUsers(query: Partial<TUserListQuery> = {}) {
    const { page = 1, limit = 20, search } = query;
    return this.get(
      {
        page,
        limit,
        ...(search ? { search } : {}),
      },
      "/available-users",
    ) as unknown as Promise<IPaginatedResponse<TUserRow>>;
  }

  create(body: TCreateChatData) {
    return this.post<TCreateChatResponse>(body);
  }

  listMessages(
    chatId: string,
    query: { page?: number; limit?: number } = {},
  ) {
    const { page = 1, limit = 50 } = query;
    return this.get(
      { page, limit },
      `/${chatId}/messages`,
    ) as unknown as Promise<IPaginatedChatMessages>;
  }

  sendMessage(chatId: string, body: TSendChatMessageData) {
    return this.post<IChatMessage>(body, undefined, `/${chatId}/messages`);
  }
}

export const chatService = new ChatService();
