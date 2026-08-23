import { z } from "zod";
import { listQuerySchema } from "../../common/schema.js";
import { EAiProcessorType } from "./enum.js";

/** GET /ai-processors query */
export const aiProcessorListQuerySchema = listQuerySchema;

export const aiProcessorSchema = z.object({
  id: z.string().uuid(),
  type: z.nativeEnum(EAiProcessorType),
  name: z.string(),
  enabled: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const aiProcessorCurrentSchema = z.object({
  processor: aiProcessorSchema,
  source: z.enum(["business", "env_default"]),
  config: z.object({
    model: z.string().optional(),
    hasApiKey: z.boolean(),
  }),
});

export const aiCompletionRequestSchema = z.object({
  prompt: z.string().min(1).max(8000),
  model: z.string().min(1).max(100).optional(),
  system: z.string().max(4000).optional(),
});

export const aiCompletionResponseSchema = z.object({
  text: z.string(),
  model: z.string(),
  processorType: z.nativeEnum(EAiProcessorType),
});
