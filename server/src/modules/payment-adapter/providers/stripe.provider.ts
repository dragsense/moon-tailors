import { BadRequestException, Logger } from "@nestjs/common";
import { EPaymentProcessorType } from "@template/contracts";
import Stripe from "stripe";
import type { Repository } from "typeorm";
import type { UserEntity } from "../../../common/base";
import type { PaymentCustomerEntity } from "../entities/payment-customer.entity";
import type {
  PaymentCardInfo,
  PaymentCardsResult,
  PaymentCustomerResult,
  PaymentIntentResult,
} from "../interfaces/payment-adapter.interface";

/**
 * Stripe implementation details — not a Nest provider.
 * `PaymentAdapterService` owns the public API and chooses this when type=stripe.
 */
export class StripePaymentProvider {
  private readonly logger = new Logger(StripePaymentProvider.name);

  constructor(
    private readonly stripe: Stripe | null,
    /** Lazy — resolve per call so EntityRouter picks the current tenant DS. */
    private readonly getCustomers: () => Repository<PaymentCustomerEntity>,
  ) {
    if (!this.stripe) {
      this.logger.warn("STRIPE_SECRET_KEY missing — Stripe provider inactive");
    }
  }

  private get customers() {
    return this.getCustomers();
  }

  private client(): Stripe {
    if (!this.stripe) {
      throw new BadRequestException("Stripe is not configured");
    }
    return this.stripe;
  }

  async createOrGetCustomer(user: UserEntity): Promise<PaymentCustomerResult> {
    const existing = await this.customers.findOne({
      where: {
        userId: user.id,
        processorType: EPaymentProcessorType.STRIPE,
      },
    });
    if (existing) return { customerId: existing.customerId };

    const customer = await this.client().customers.create({
      email: user.email,
      name: `${user.firstName} ${user.lastName}`.trim(),
      metadata: { userId: user.id },
    });
    await this.customers.save(
      this.customers.create({
        userId: user.id,
        processorType: EPaymentProcessorType.STRIPE,
        customerId: customer.id,
      }),
    );
    return { customerId: customer.id };
  }

  async createPaymentIntent(params: {
    amountCents: number;
    customerId: string;
    paymentMethodId: string;
    currency?: string;
    confirm?: boolean;
    metadata?: Record<string, string>;
    applicationFeeAmount?: number;
    stripeAccount?: string;
  }): Promise<PaymentIntentResult> {
    const intent = await this.client().paymentIntents.create(
      {
        amount: params.amountCents,
        currency: params.currency ?? "usd",
        customer: params.customerId,
        payment_method: params.paymentMethodId,
        confirm: params.confirm ?? true,
        metadata: params.metadata,
        automatic_payment_methods: { enabled: true, allow_redirects: "never" },
        ...(params.applicationFeeAmount
          ? { application_fee_amount: params.applicationFeeAmount }
          : {}),
      },
      params.stripeAccount
        ? { stripeAccount: params.stripeAccount }
        : undefined,
    );
    return {
      id: intent.id,
      status: intent.status,
      clientSecret: intent.client_secret,
    };
  }

  async listCards(user: UserEntity): Promise<PaymentCardsResult> {
    const { customerId } = await this.createOrGetCustomer(user);
    const customer = (await this.client().customers.retrieve(
      customerId,
    )) as Stripe.Customer;
    const list = await this.client().paymentMethods.list({
      customer: customerId,
      type: "card",
    });
    const defaultId =
      typeof customer.invoice_settings?.default_payment_method === "string"
        ? customer.invoice_settings.default_payment_method
        : null;

    return {
      defaultPaymentMethodId: defaultId,
      paymentMethods: list.data.map((pm) => this.toCard(pm, defaultId)),
    };
  }

  async attachPaymentMethod(
    user: UserEntity,
    paymentMethodId: string,
    setAsDefault = true,
  ): Promise<PaymentCardInfo> {
    const { customerId } = await this.createOrGetCustomer(user);
    const pm = await this.client().paymentMethods.attach(paymentMethodId, {
      customer: customerId,
    });
    if (setAsDefault) {
      await this.client().customers.update(customerId, {
        invoice_settings: { default_payment_method: paymentMethodId },
      });
    }
    return this.toCard(pm, setAsDefault ? paymentMethodId : null);
  }

  async detachPaymentMethod(
    user: UserEntity,
    paymentMethodId: string,
  ): Promise<void> {
    await this.createOrGetCustomer(user);
    await this.client().paymentMethods.detach(paymentMethodId);
  }

  private toCard(
    pm: Stripe.PaymentMethod,
    defaultId: string | null,
  ): PaymentCardInfo {
    return {
      id: pm.id,
      brand: pm.card?.brand,
      last4: pm.card?.last4 ?? "0000",
      expMonth: pm.card?.exp_month,
      expYear: pm.card?.exp_year,
      isDefault: defaultId === pm.id,
    };
  }
}
