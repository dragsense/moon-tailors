import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
} from "@nestjs/websockets";
import { Logger } from "@nestjs/common";
import { Server, Socket } from "socket.io";

/**
 * Reusable Socket.IO gateway — emit to rooms, clients, or everyone.
 * Feature modules (chat, notifications, …) inject this instead of owning a server.
 */
@WebSocketGateway({ cors: { origin: true, credentials: true } })
export class ServerGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(ServerGateway.name);
  private static instance: ServerGateway | undefined;

  afterInit() {
    ServerGateway.instance = this;
    this.logger.log("Server gateway initialized");
  }

  static getInstance(): ServerGateway | undefined {
    return ServerGateway.instance;
  }

  emitToAll(event: string, data: unknown): void {
    if (!this.server) return;
    this.server.emit(event, data);
  }

  emitToClient(socketId: string, event: string, data: unknown): void {
    if (!this.server) return;
    this.server.to(socketId).emit(event, data);
  }

  /** Emit to a named room (chat:userId, chat:chatId, user:userId, …). */
  emitToRoom(room: string, event: string, data: unknown): void {
    if (!this.server) return;
    this.server.to(room).emit(event, data);
  }

  handleConnection(client: Socket) {
    this.logger.debug(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.debug(`Client disconnected: ${client.id}`);
  }
}
