import { registerAs } from "@nestjs/config";
import {
  EAiProcessorType,
  EPaymentProcessorType,
} from "@moon-tailors/contracts";

export type PaymentProcessorsConfig = {
  enabled: boolean;
  defaultType: EPaymentProcessorType;
  stripe: {
    secretKey?: string;
    publishableKey?: string;
    webhookSecret?: string;
  };
};

export type AiProcessorsConfig = {
  defaultType: EAiProcessorType;
  openai: { apiKey?: string; model: string };
  anthropic: { apiKey?: string; model: string };
  gemini: { apiKey?: string; model: string };
};

function parsePaymentType(raw?: string): EPaymentProcessorType {
  const value = (raw ?? EPaymentProcessorType.STRIPE).toLowerCase();
  if (Object.values(EPaymentProcessorType).includes(value as EPaymentProcessorType)) {
    return value as EPaymentProcessorType;
  }
  return EPaymentProcessorType.STRIPE;
}

function parseAiType(raw?: string): EAiProcessorType {
  const value = (raw ?? EAiProcessorType.OPENAI).toLowerCase();
  if (Object.values(EAiProcessorType).includes(value as EAiProcessorType)) {
    return value as EAiProcessorType;
  }
  return EAiProcessorType.OPENAI;
}

export const paymentProcessorsConfig = registerAs(
  "paymentProcessors",
  (): PaymentProcessorsConfig => ({
    enabled: process.env.STRIPE_ENABLED === "true",
    defaultType: parsePaymentType(process.env.DEFAULT_PAYMENT_PROCESSOR),
    stripe: {
      secretKey: process.env.STRIPE_SECRET_KEY,
      publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
      webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
    },
  }),
);

export const aiProcessorsConfig = registerAs(
  "aiProcessors",
  (): AiProcessorsConfig => ({
    defaultType: parseAiType(process.env.DEFAULT_AI_PROCESSOR),
    openai: {
      apiKey: process.env.OPENAI_API_KEY,
      model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
    },
    anthropic: {
      apiKey: process.env.ANTHROPIC_API_KEY,
      model: process.env.ANTHROPIC_MODEL ?? "claude-3-5-haiku-latest",
    },
    gemini: {
      apiKey: process.env.GEMINI_API_KEY,
      model: process.env.GEMINI_MODEL ?? "gemini-2.0-flash",
    },
  }),
);
