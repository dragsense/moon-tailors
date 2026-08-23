import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from "@nestjs/common";
import type {
  IMessageResponse,
  IPaginatedResponse,
  TChatListQuery,
  TChatMessageListQuery,
  TCreateChatData,
  TSendChatMessageData,
  TUserListQuery,
} from "@template/contracts";
import { ENotificationType, EResource } from "@template/contracts";
import {
  BaseChatService,
  BaseUsersService,
  PermissionsService,
  type ChatEntity,
  type ChatMessageEntity,
  type UserEntity,
} from "../../common/base";
import { NotificationsService } from "../notifications/notifications.service";
import { ChatWebSocketService } from "./services/chat-websocket.service";

export type TCreateChatResult = IMessageResponse & { chat: ChatEntity };

@Injectable()
export class ChatService implements OnModuleInit {
  constructor(
    private readonly chatStore: BaseChatService,
    private readonly usersService: BaseUsersService,
    private readonly permissions: PermissionsService,
    private readonly chatSocket: ChatWebSocketService,
    private readonly notifications: NotificationsService,
  ) {}

  async onModuleInit() {
    await this.permissions.ensureResource(EResource.CHAT);
  }

  async createOrGetDirectChat(
    userId: string,
    body: TCreateChatData,
  ): Promise<TCreateChatResult> {
    if (body.participantId === userId) {
      throw new ForbiddenException("Cannot chat with yourself");
    }
    await this.usersService.requireById(body.participantId);

    const existing = await this.chatStore.findDirectChat(
      userId,
      body.participantId,
    );
    if (existing) {
      return {
        message: "Chat already exists",
        chat: this.withViewer(existing, userId),
      };
    }

    const created = await this.chatStore.createChat({
      participantIds: [userId, body.participantId],
      isGroup: false,
    });

    const chat = this.withViewer(created, userId);
    this.chatSocket.emitToUser(body.participantId, "newChat", chat);

    return { message: "Chat created", chat };
  }

  async listAvailableUsers(
    userId: string,
    query: TUserListQuery,
  ): Promise<IPaginatedResponse<UserEntity>> {
    const all = await this.usersService.list(query);
    return {
      ...all,
      data: all.data.filter((user) => user.id !== userId),
    };
  }

  async listChats(
    userId: string,
    query: TChatListQuery,
  ): Promise<IPaginatedResponse<ChatEntity>> {
    const page = await this.chatStore.listChatsForUser(userId, query);
    return {
      ...page,
      data: page.data.map((chat) => this.withViewer(chat, userId)),
    };
  }

  async listMessages(
    userId: string,
    chatId: string,
    query: TChatMessageListQuery,
  ): Promise<IPaginatedResponse<ChatMessageEntity>> {
    await this.requireParticipant(userId, chatId);
    await this.chatStore.clearUnread(userId, chatId);
    return this.chatStore.listMessages(chatId, query);
  }

  async sendMessage(
    userId: string,
    chatId: string,
    body: TSendChatMessageData,
  ): Promise<ChatMessageEntity> {
    await this.requireParticipant(userId, chatId);

    const message = await this.chatStore.addMessage({
      chatId,
      senderId: userId,
      message: body.message.trim(),
    });

    const chat = this.withViewer(
      await this.chatStore.requireChatById(chatId),
      userId,
    );

    this.chatSocket.emitToChatRoom(chatId, "newMessage", message);

    for (const participantId of chat.participantIds ?? []) {
      if (participantId === userId) continue;
      this.chatSocket.emitToUser(participantId, "newUnreadCount", {
        chatId,
        unreadCount: await this.chatStore.getUnreadCount(participantId, chatId),
      });
      this.chatSocket.emitToUser(participantId, "newChat", chat);
      void this.notifications.notifyUser({
        recipientId: participantId,
        title: "New chat message",
        message: message.message,
        entityType: "chat",
        metadata: { chatId, messageId: message.id, senderId: userId },
        type: ENotificationType.INFO,
      });
    }

    return message;
  }

  private async requireParticipant(userId: string, chatId: string) {
    const chat = await this.chatStore.getChatById(chatId);
    if (!chat) throw new NotFoundException("Chat not found");
    if (!(await this.chatStore.isParticipant(userId, chatId))) {
      throw new ForbiddenException("Not a chat participant");
    }
    return chat;
  }

  /** Attach viewer unread + participantIds; keep `participants.user` relations. */
  private withViewer(entity: ChatEntity, viewerId: string): ChatEntity {
    const mine = entity.participants?.find((row) => row.userId === viewerId);
    entity.unreadCount = mine?.unreadCount ?? 0;
    entity.participantIds = (entity.participants ?? []).map((row) => row.userId);
    return entity;
  }
}
