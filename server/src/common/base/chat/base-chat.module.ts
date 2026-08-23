import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { BaseChatService } from "./base-chat.service";
import {
  ChatEntity,
  ChatMessageEntity,
  ChatParticipantEntity,
} from "./entities";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ChatEntity,
      ChatMessageEntity,
      ChatParticipantEntity,
    ]),
  ],
  providers: [BaseChatService],
  exports: [BaseChatService, TypeOrmModule],
})
export class BaseChatModule {}
