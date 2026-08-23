import type { z } from "zod";
import type { IMessageResponse } from "../../common/interface.js";
import {
  chatMessageSchema,
  chatParticipantSchema,
  chatSchema,
  chatUserSchema,
  paginatedChatMessagesSchema,
  paginatedChatsSchema,
} from "./schema.js";

export interface IChatUser extends z.infer<typeof chatUserSchema> {}

export interface IChatParticipant
  extends z.infer<typeof chatParticipantSchema> {}

export interface IChatMessage extends z.infer<typeof chatMessageSchema> {}

export interface IChat extends z.infer<typeof chatSchema> {}

export interface IPaginatedChats
  extends z.infer<typeof paginatedChatsSchema> {}

export interface IPaginatedChatMessages
  extends z.infer<typeof paginatedChatMessagesSchema> {}

export type TCreateChatResponse = IMessageResponse & { chat: IChat };
