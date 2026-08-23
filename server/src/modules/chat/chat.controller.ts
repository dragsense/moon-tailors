import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
} from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import type {
  IPaginatedResponse,
  TChatListQuery,
  TChatMessageListQuery,
  TCreateChatData,
  TSendChatMessageData,
  TUserListQuery,
} from "@template/contracts";
import {
  chatListQuerySchema,
  chatMessageListQuerySchema,
  createChatSchema,
  EPermissionAction,
  EResource,
  sendChatMessageSchema,
  userListQuerySchema,
} from "@template/contracts";
import type {
  ChatEntity,
  ChatMessageEntity,
  UserEntity,
} from "../../common/base";
import { CurrentUser, RequirePermissions } from "../../common/auth";
import { ZodValidationPipe } from "../../common/validation";
import { ChatService, type TCreateChatResult } from "./chat.service";

@ApiTags("Chat")
@Controller("chat")
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post()
  @RequirePermissions({
    resource: EResource.CHAT,
    action: EPermissionAction.CREATE,
  })
  createOrGet(
    @CurrentUser() user: UserEntity,
    @Body(new ZodValidationPipe(createChatSchema)) body: TCreateChatData,
  ): Promise<TCreateChatResult> {
    return this.chatService.createOrGetDirectChat(user.id, body);
  }

  @Get()
  @RequirePermissions({
    resource: EResource.CHAT,
    action: EPermissionAction.READ,
  })
  list(
    @CurrentUser() user: UserEntity,
    @Query(new ZodValidationPipe(chatListQuerySchema)) query: TChatListQuery,
  ): Promise<IPaginatedResponse<ChatEntity>> {
    return this.chatService.listChats(user.id, query);
  }

  @Get("available-users")
  @RequirePermissions({
    resource: EResource.CHAT,
    action: EPermissionAction.READ,
  })
  availableUsers(
    @CurrentUser() user: UserEntity,
    @Query(new ZodValidationPipe(userListQuerySchema)) query: TUserListQuery,
  ): Promise<IPaginatedResponse<UserEntity>> {
    return this.chatService.listAvailableUsers(user.id, query);
  }

  @Get(":id/messages")
  @RequirePermissions({
    resource: EResource.CHAT,
    action: EPermissionAction.READ,
  })
  listMessages(
    @CurrentUser() user: UserEntity,
    @Param("id") chatId: string,
    @Query(new ZodValidationPipe(chatMessageListQuerySchema))
    query: TChatMessageListQuery,
  ): Promise<IPaginatedResponse<ChatMessageEntity>> {
    return this.chatService.listMessages(user.id, chatId, {
      ...query,
      chatId,
    });
  }

  @Post(":id/messages")
  @RequirePermissions({
    resource: EResource.CHAT,
    action: EPermissionAction.CREATE,
  })
  sendMessage(
    @CurrentUser() user: UserEntity,
    @Param("id") chatId: string,
    @Body(new ZodValidationPipe(sendChatMessageSchema)) body: TSendChatMessageData,
  ): Promise<ChatMessageEntity> {
    return this.chatService.sendMessage(user.id, chatId, body);
  }
}
