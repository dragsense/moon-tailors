import {
  type IPaymentCard,
  type IPaymentCardsResponse,
  type IPaymentIntentResult,
  type IPaymentProcessorCurrent,
  type IStripeConnectAccount,
  type IStripeConnectLink,
  type TAddPaymentCard,
  type TCreatePaymentIntent,
} from "@template/contracts";
import { BaseService } from "~/lib/api";

class PaymentsService extends BaseService<
  IPaymentCard,
  Record<string, unknown>,
  Record<string, unknown>
> {
  constructor() {
    super("/payments");
  }

  current() {
    return this.getSingle<IPaymentProcessorCurrent>(
      undefined,
      undefined,
      "/current",
    );
  }

  listCards() {
    return this.getSingle<IPaymentCardsResponse>(
      undefined,
      undefined,
      "/cards",
    );
  }

  addCard(body: TAddPaymentCard) {
    return this.post<IPaymentCard>(body, undefined, "/cards");
  }

  removeCard(paymentMethodId: string) {
    return this.delete<{ message: string }>(
      paymentMethodId,
      undefined,
      "/cards",
    );
  }

  createPaymentIntent(body: TCreatePaymentIntent) {
    return this.post<IPaymentIntentResult>(
      body,
      undefined,
      "/payment-intents",
    );
  }

  connectAccount() {
    return this.post<IStripeConnectAccount>({}, undefined, "/connect");
  }

  connectStatus() {
    return this.getSingle<IStripeConnectAccount>(
      undefined,
      undefined,
      "/connect",
    );
  }

  connectLoginLink() {
    return this.post<IStripeConnectLink>({}, undefined, "/connect/login-link");
  }
}

export const paymentsService = new PaymentsService();
