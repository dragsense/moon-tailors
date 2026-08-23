import type { z } from "zod";
import {
  chatListQuerySchema,
  chatMessageListQuerySchema,
  createChatSchema,
  sendChatMessageSchema,
} from "./schema.js";

export type TCreateChatData = z.infer<typeof createChatSchema>;
export type TSendChatMessageData = z.infer<typeof sendChatMessageSchema>;
export type TChatListQuery = z.infer<typeof chatListQuerySchema>;
export type TChatMessageListQuery = z.infer<typeof chatMessageListQuerySchema>;
