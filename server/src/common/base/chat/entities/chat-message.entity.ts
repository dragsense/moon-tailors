import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
} from "typeorm";
import { EChatMessageType } from "@template/contracts";
import { GeneralBaseEntity } from "../../../entities";
import { UserEntity } from "../../users/entities/user.entity";
import { ChatEntity } from "./chat.entity";

@Entity("base_chat_messages")
export class ChatMessageEntity extends GeneralBaseEntity {
  @Index()
  @Column({ type: "uuid" })
  chatId!: string;

  @ManyToOne(() => ChatEntity, (chat) => chat.messages, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "chatId" })
  chat!: ChatEntity;

  @Index()
  @Column({ type: "uuid" })
  senderId!: string;

  @ManyToOne(() => UserEntity, { onDelete: "CASCADE" })
  @JoinColumn({ name: "senderId" })
  sender!: UserEntity;

  @Column({ type: "text" })
  message!: string;

  @Column({ type: "varchar", length: 32, default: EChatMessageType.TEXT })
  messageType!: EChatMessageType;
}
