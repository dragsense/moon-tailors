import { Module } from "@nestjs/common";
import {
  BaseChatModule,
  BaseUsersModule,
  PermissionsModule,
} from "../../common/base";
import { ServerGatewayModule } from "../../common/gateways";
import { NotificationsModule } from "../notifications/notifications.module";
import { ChatController } from "./chat.controller";
import { ChatService } from "./chat.service";
import { ChatWebSocketService } from "./services/chat-websocket.service";

@Module({
  imports: [
    ServerGatewayModule,
    BaseChatModule,
    BaseUsersModule,
    PermissionsModule,
    NotificationsModule,
  ],
  controllers: [ChatController],
  providers: [ChatService, ChatWebSocketService],
  exports: [ChatService, ChatWebSocketService],
})
export class ChatModule {}
