import type { z } from "zod";
import {
  aiCompletionRequestSchema,
  aiCompletionResponseSchema,
  aiProcessorCurrentSchema,
  aiProcessorListQuerySchema,
  aiProcessorSchema,
} from "./schema.js";

export type TAiProcessorListQuery = z.infer<typeof aiProcessorListQuerySchema>;
export interface IAiProcessor extends z.infer<typeof aiProcessorSchema> {}
export interface IAiProcessorCurrent
  extends z.infer<typeof aiProcessorCurrentSchema> {}
export type TAiCompletionRequest = z.infer<typeof aiCompletionRequestSchema>;
export interface IAiCompletionResponse
  extends z.infer<typeof aiCompletionResponseSchema> {}
