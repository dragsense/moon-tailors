import { z } from "zod";

export const paymentCardSchema = z.object({
  id: z.string(),
  brand: z.string().optional(),
  last4: z.string(),
  expMonth: z.number().optional(),
  expYear: z.number().optional(),
  isDefault: z.boolean().optional(),
});

export const paymentCardsResponseSchema = z.object({
  paymentMethods: z.array(paymentCardSchema),
  defaultPaymentMethodId: z.string().nullable().optional(),
});

export const addPaymentCardSchema = z.object({
  paymentMethodId: z.string().min(1),
  setAsDefault: z.boolean().optional(),
});

export const createPaymentIntentSchema = z.object({
  amountCents: z.coerce.number().int().positive(),
  paymentMethodId: z.string().min(1),
  currency: z.string().default("usd"),
  confirm: z.boolean().default(true),
  metadata: z.record(z.string()).optional(),
  /** Connect split — platform application fee in cents. */
  applicationFeeAmountCents: z.coerce.number().int().min(0).optional(),
});

export const paymentIntentResultSchema = z.object({
  id: z.string(),
  status: z.string(),
  clientSecret: z.string().nullable().optional(),
});

export const stripeConnectAccountSchema = z.object({
  id: z.string().uuid(),
  accountId: z.string(),
  chargesEnabled: z.boolean(),
  detailsSubmitted: z.boolean(),
  onboardingUrl: z.string().url().nullable().optional(),
});

export const stripeConnectLinkSchema = z.object({
  url: z.string().url(),
});
