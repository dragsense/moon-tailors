import type { z } from "zod";
import {
  paymentCardSchema,
  paymentCardsResponseSchema,
  addPaymentCardSchema,
  createPaymentIntentSchema,
  paymentIntentResultSchema,
  stripeConnectAccountSchema,
  stripeConnectLinkSchema,
} from "./schema.js";

export type IPaymentCard = z.infer<typeof paymentCardSchema>;
export type IPaymentCardsResponse = z.infer<typeof paymentCardsResponseSchema>;
export type TAddPaymentCard = z.infer<typeof addPaymentCardSchema>;
export type TCreatePaymentIntent = z.infer<typeof createPaymentIntentSchema>;
export type IPaymentIntentResult = z.infer<typeof paymentIntentResultSchema>;
export type IStripeConnectAccount = z.infer<typeof stripeConnectAccountSchema>;
export type IStripeConnectLink = z.infer<typeof stripeConnectLinkSchema>;
