import { Injectable, Logger } from "@nestjs/common";
import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
} from "@nestjs/websockets";
import { Socket } from "socket.io";
import { ServerGateway } from "../../../common/gateways";

/**
 * Chat-specific socket handlers — join/leave rooms.
 * Push events go through ServerGateway from ChatService.
 */
@Injectable()
@WebSocketGateway({ cors: { origin: true, credentials: true } })
export class ChatWebSocketService {
  private readonly logger = new Logger(ChatWebSocketService.name);

  constructor(private readonly gateway: ServerGateway) {}

  @SubscribeMessage("joinChat")
  handleJoinChat(
    @MessageBody() data: { chatId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const room = this.chatRoom(data.chatId);
    void client.join(room);
    this.logger.debug(`Client ${client.id} joined ${room}`);
    return { success: true };
  }

  @SubscribeMessage("leaveChat")
  handleLeaveChat(
    @MessageBody() data: { chatId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const room = this.chatRoom(data.chatId);
    void client.leave(room);
    return { success: true };
  }

  @SubscribeMessage("joinUserRoom")
  handleJoinUserRoom(
    @MessageBody() data: { userId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const room = this.userRoom(data.userId);
    void client.join(room);
    this.logger.debug(`Client ${client.id} joined ${room}`);
    return { success: true };
  }

  emitToChatRoom(chatId: string, event: string, data: unknown): void {
    this.gateway.emitToRoom(this.chatRoom(chatId), event, data);
  }

  emitToUser(userId: string, event: string, data: unknown): void {
    this.gateway.emitToRoom(this.userRoom(userId), event, data);
  }

  private chatRoom(chatId: string) {
    return `chat:${chatId}`;
  }

  private userRoom(userId: string) {
    return `user:${userId}`;
  }
}
