import { Injectable, NotFoundException } from "@nestjs/common";
import type {
  IChatMessage,
  IPaginatedResponse,
  TChatListQuery,
  TChatMessageListQuery,
} from "@template/contracts";
import {
  chatListQuerySchema,
  chatMessageListQuerySchema,
  EChatMessageType,
  filtersFromListSchema,
} from "@template/contracts";
import {
  EntityService,
  type IBoundEntityService,
} from "../../database";
import {
  buildEntityQuery,
  type EntityQueryConfig,
} from "../../query";
import {
  ChatEntity,
  ChatMessageEntity,
  ChatParticipantEntity,
} from "./entities";

/** Default graph for chat list / get. */
export const CHAT_RELATIONS = [
  "participants",
  "participants.user",
  "lastMessage",
  "lastMessage.sender",
] as const;

export const CHAT_QUERY: EntityQueryConfig = {
  alias: "chat",
  restrictedFields: ["passwordHash"],
  searchable: [
    "name",
    "participants.user.email",
    "participants.user.firstName",
    "participants.user.lastName",
    "participants.user.fullName",
  ],
  sortable: ["createdAt", "updatedAt", "name"],
  defaultSort: { field: "updatedAt", order: "DESC" },
  filters: filtersFromListSchema(chatListQuerySchema),
};

export const CHAT_MESSAGE_QUERY: EntityQueryConfig = {
  alias: "message",
  restrictedFields: ["passwordHash"],
  searchable: [
    "message",
    "sender.firstName",
    "sender.lastName",
    "sender.email",
    "sender.fullName",
  ],
  sortable: ["createdAt", "updatedAt", "sender.firstName"],
  defaultSort: { field: "createdAt", order: "ASC" },
  filters: filtersFromListSchema(chatMessageListQuerySchema),
};

export const CHAT_PARTICIPANT_QUERY: EntityQueryConfig = {
  alias: "participant",
  restrictedFields: ["passwordHash"],
  sortable: ["createdAt"],
  defaultSort: { field: "createdAt", order: "ASC" },
};

@Injectable()
export class BaseChatService {
  private readonly chats: IBoundEntityService<ChatEntity>;
  private readonly messages: IBoundEntityService<ChatMessageEntity>;
  private readonly participants: IBoundEntityService<ChatParticipantEntity>;

  constructor(private readonly entityService: EntityService) {
    this.chats = this.entityService.bind(ChatEntity, CHAT_QUERY);
    this.messages = this.entityService.bind(
      ChatMessageEntity,
      CHAT_MESSAGE_QUERY,
    );
    this.participants = this.entityService.bind(
      ChatParticipantEntity,
      CHAT_PARTICIPANT_QUERY,
    );
  }

  async createChat(input: {
    participantIds: string[];
    name?: string | null;
    isGroup?: boolean;
  }): Promise<ChatEntity> {
    const uniqueIds = [...new Set(input.participantIds)].sort();
    const chat = await this.chats.create(
      {
        name: input.name ?? null,
        isGroup: input.isGroup ?? false,
      },
      {
        afterCreate: async (created, manager) => {
          await manager.save(
            uniqueIds.map((userId) =>
              manager.create(ChatParticipantEntity, {
                chatId: created.id,
                userId,
                unreadCount: 0,
              }),
            ),
          );
        },
      },
    );
    return this.requireChatById(chat.id);
  }

  async findDirectChat(
    userA: string,
    userB: string,
  ): Promise<ChatEntity | null> {
    const qb = await buildEntityQuery(
      this.chats.getRepository(),
      CHAT_QUERY,
      {
        page: 1,
        limit: 1,
        _relations: [...CHAT_RELATIONS],
      },
      {
        // Participant join is the ACL — skip default owner.
        access: [],
        beforeQuery: (builder) => {
          builder
            .innerJoin("chat.participants", "p1", "p1.userId = :userA", {
              userA,
            })
            .innerJoin("chat.participants", "p2", "p2.userId = :userB", {
              userB,
            })
            .andWhere("chat.isGroup = :isGroup", { isGroup: false });
        },
      },
    );
    return qb.getOne();
  }

  getChatById(id: string): Promise<ChatEntity | null> {
    return this.chats.get(id, {
      access: [],
      _relations: [...CHAT_RELATIONS],
    });
  }

  requireChatById(id: string): Promise<ChatEntity> {
    return this.chats.require(id, {
      access: [],
      _relations: [...CHAT_RELATIONS],
    });
  }

  /**
   * Chats the viewer participates in — sortable fields + participant ACL.
   * Client may pass `_relations` / `_select`; `passwordHash` is restricted.
   * Participant name/email search is applied in `beforeQuery` (not root columns).
   */
  listChatsForUser(
    userId: string,
    query: TChatListQuery,
  ): Promise<IPaginatedResponse<ChatEntity>> {
    return this.chats.list(query, {
      // Participant join is the ACL — skip default owner.
      access: [],
      _relations: query._relations?.length
        ? query._relations
        : [...CHAT_RELATIONS],
      beforeQuery: (builder) => {
        // Nested search/filters use `participants` / `participants_user` joins
        // from CHAT_QUERY.searchable — ACL is a separate viewer join.
        builder.distinct(true);
        builder.innerJoin(
          "chat.participants",
          "myParticipant",
          "myParticipant.userId = :viewerId",
          { viewerId: userId },
        );
      },
    });
  }

  async isParticipant(userId: string, chatId: string): Promise<boolean> {
    const row = await this.participants.get(
      { chatId, userId },
      { access: { type: "eq", column: "userId", value: userId } },
    );
    return row != null;
  }

  async getUnreadCount(userId: string, chatId: string): Promise<number> {
    const row = await this.participants.get(
      { chatId, userId },
      { access: { type: "eq", column: "userId", value: userId } },
    );
    return row?.unreadCount ?? 0;
  }

  async clearUnread(userId: string, chatId: string): Promise<void> {
    const row = await this.participants.get(
      { chatId, userId },
      { access: { type: "eq", column: "userId", value: userId } },
    );
    if (!row) return;
    await this.participants.update(row.id, { unreadCount: 0 });
  }

  async addMessage(input: {
    chatId: string;
    senderId: string;
    message: string;
    messageType?: IChatMessage["messageType"];
  }): Promise<ChatMessageEntity> {
    const chat = await this.requireChatById(input.chatId);
    const participant = chat.participants?.find(
      (row) => row.userId === input.senderId,
    );
    if (!participant) {
      throw new NotFoundException("Chat not found");
    }

    const saved = await this.messages.create({
      chatId: input.chatId,
      senderId: input.senderId,
      message: input.message,
      messageType: input.messageType ?? EChatMessageType.TEXT,
    });

    await this.chats.update(input.chatId, {
      lastMessageId: saved.id,
      updatedAt: new Date(),
    });

    await this.participants
      .getRepository()
      .createQueryBuilder()
      .update()
      .set({ unreadCount: () => "unreadCount + 1" })
      .where("chatId = :chatId AND userId != :senderId", {
        chatId: input.chatId,
        senderId: input.senderId,
      })
      .execute();

    return this.messages.require(saved.id, { _relations: ["sender"] });
  }

  listMessages(
    chatId: string,
    query: TChatMessageListQuery,
  ): Promise<IPaginatedResponse<ChatMessageEntity>> {
    return this.messages.list(query, {
      _relations: query._relations?.length ? query._relations : ["sender"],
      access: { type: "eq", column: "chatId", value: chatId },
    });
  }
}
