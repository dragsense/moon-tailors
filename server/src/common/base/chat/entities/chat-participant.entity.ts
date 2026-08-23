import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  Unique,
} from "typeorm";
import { GeneralBaseEntity } from "../../../entities";
import { UserEntity } from "../../users/entities/user.entity";
import { ChatEntity } from "./chat.entity";

@Entity("base_chat_participants")
@Unique(["chatId", "userId"])
export class ChatParticipantEntity extends GeneralBaseEntity {
  @Index()
  @Column({ type: "uuid" })
  chatId!: string;

  @ManyToOne(() => ChatEntity, (chat) => chat.participants, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "chatId" })
  chat!: ChatEntity;

  @Index()
  @Column({ type: "uuid" })
  userId!: string;

  @ManyToOne(() => UserEntity, { onDelete: "CASCADE" })
  @JoinColumn({ name: "userId" })
  user!: UserEntity;

  @Column({ type: "int", default: 0 })
  unreadCount!: number;
}
