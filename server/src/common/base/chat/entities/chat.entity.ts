import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
} from "typeorm";
import { GeneralBaseEntity } from "../../../entities";
import { ChatMessageEntity } from "./chat-message.entity";
import { ChatParticipantEntity } from "./chat-participant.entity";

@Entity("base_chats")
export class ChatEntity extends GeneralBaseEntity {
  @Column({ type: "varchar", length: 255, nullable: true })
  name!: string | null;

  @Column({ type: "boolean", default: false })
  isGroup!: boolean;

  @Column({ type: "uuid", nullable: true })
  lastMessageId!: string | null;

  @ManyToOne(() => ChatMessageEntity, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "lastMessageId" })
  lastMessage?: ChatMessageEntity | null;

  @OneToMany(() => ChatParticipantEntity, (participant) => participant.chat)
  participants?: ChatParticipantEntity[];

  @OneToMany(() => ChatMessageEntity, (message) => message.chat)
  messages?: ChatMessageEntity[];

  /** Viewer-scoped — attached by ChatService (not a DB column). */
  unreadCount?: number;
  /** Convenience ids from `participants` relation. */
  participantIds?: string[];
}
