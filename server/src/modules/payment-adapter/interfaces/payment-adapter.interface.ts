import type { UserEntity } from "../../../common/base";

export type PaymentCustomerResult = {
  customerId: string;
  metadata?: Record<string, string>;
};

export type PaymentCardInfo = {
  id: string;
  brand?: string;
  last4: string;
  expMonth?: number;
  expYear?: number;
  isDefault?: boolean;
};

export type PaymentIntentResult = {
  id: string;
  status: string;
  clientSecret?: string | null;
  metadata?: Record<string, unknown>;
};

export type PaymentCardsResult = {
  paymentMethods: PaymentCardInfo[];
  defaultPaymentMethodId?: string | null;
};

/**
 * Public payment operations. Implemented by the single `PaymentAdapterService`
 * facade — callers never pick Stripe/Paysafe themselves.
 */
export interface IPaymentAdapter {
  createOrGetCustomer(user: UserEntity): Promise<PaymentCustomerResult>;

  createPaymentIntent(params: {
    amountCents: number;
    customerId: string;
    paymentMethodId: string;
    currency?: string;
    confirm?: boolean;
    metadata?: Record<string, string>;
    /** Connect application fee (= split / platform cut). */
    applicationFeeAmount?: number;
    stripeAccount?: string;
  }): Promise<PaymentIntentResult>;

  listCards(user: UserEntity): Promise<PaymentCardsResult>;

  attachPaymentMethod(
    user: UserEntity,
    paymentMethodId: string,
    setAsDefault?: boolean,
  ): Promise<PaymentCardInfo>;

  detachPaymentMethod(user: UserEntity, paymentMethodId: string): Promise<void>;
}
