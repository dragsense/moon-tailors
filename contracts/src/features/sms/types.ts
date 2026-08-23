import type { z } from "zod";
import type {
  paginatedSmsMessagesSchema,
  sendSmsSchema,
  smsMessageListQuerySchema,
  smsMessageSchema,
  smsStatusSchema,
  smsThreadSchema,
} from "./schema.js";

export type ISmsMessage = z.infer<typeof smsMessageSchema>;
export type ISmsThread = z.infer<typeof smsThreadSchema>;
export type ISmsStatus = z.infer<typeof smsStatusSchema>;
export type IPaginatedSmsMessages = z.infer<typeof paginatedSmsMessagesSchema>;
export type TSendSmsData = z.infer<typeof sendSmsSchema>;
export type TSmsMessageListQuery = z.infer<typeof smsMessageListQuerySchema>;
