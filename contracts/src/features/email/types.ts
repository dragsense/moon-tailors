import type { z } from "zod";
import type {
  emailMessageListQuerySchema,
  emailMessageSchema,
  emailStatusSchema,
  emailSyncResultSchema,
  emailThreadSchema,
  markEmailReadSchema,
  paginatedEmailMessagesSchema,
  sendEmailSchema,
} from "./schema.js";

export type IEmailMessage = z.infer<typeof emailMessageSchema>;
export type IEmailThread = z.infer<typeof emailThreadSchema>;
export type IEmailStatus = z.infer<typeof emailStatusSchema>;
export type IEmailSyncResult = z.infer<typeof emailSyncResultSchema>;
export type IPaginatedEmailMessages = z.infer<
  typeof paginatedEmailMessagesSchema
>;
export type TSendEmailData = z.infer<typeof sendEmailSchema>;
export type TEmailMessageListQuery = z.infer<
  typeof emailMessageListQuerySchema
>;
export type TMarkEmailReadData = z.infer<typeof markEmailReadSchema>;
