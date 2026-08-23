import {
  BadRequestException,
  Injectable,
  OnModuleInit,
  ServiceUnavailableException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
  EPaymentProcessorType,
  EResource,
} from "@template/contracts";
import Stripe from "stripe";
import type { PaymentProcessorsConfig } from "../../config";
import type { UserEntity } from "../../common/base";
import { PermissionsService } from "../../common/base";
import {
  EntityService,
  type IBoundEntityService,
} from "../../common/database";
import type { EntityQueryConfig } from "../../common/query";
import {
  PaymentProcessorsService,
  type PaymentProcessorEntity,
} from "../../common/payment-processors";
import { PaymentCustomerEntity } from "./entities/payment-customer.entity";
import type {
  IPaymentAdapter,
  PaymentCardInfo,
  PaymentCardsResult,
  PaymentCustomerResult,
  PaymentIntentResult,
} from "./interfaces/payment-adapter.interface";
import { StripePaymentProvider } from "./providers/stripe.provider";

export const PAYMENT_CUSTOMER_QUERY: EntityQueryConfig = {
  alias: "paymentCustomer",
  sortable: ["createdAt"],
  defaultSort: { field: "createdAt", order: "DESC" },
};

/**
 * Single payment adapter facade.
 * Callers always use this service — it resolves processor type
 * (env for platform, DB for other businesses) then runs the same methods
 * via the matching provider under the hood.
 */
@Injectable()
export class PaymentAdapterService implements IPaymentAdapter, OnModuleInit {
  private readonly customers: IBoundEntityService<PaymentCustomerEntity>;
  private readonly stripe: StripePaymentProvider;

  constructor(
    private readonly entityService: EntityService,
    private readonly config: ConfigService,
    private readonly processors: PaymentProcessorsService,
    private readonly permissions: PermissionsService,
  ) {
    this.customers = this.entityService.bind(
      PaymentCustomerEntity,
      PAYMENT_CUSTOMER_QUERY,
    );
    const key = this.config.getOrThrow<PaymentProcessorsConfig>(
      "paymentProcessors",
    ).stripe.secretKey;
    this.stripe = new StripePaymentProvider(
      key ? new Stripe(key) : null,
      () => this.customers.getRepository(),
    );
  }

  async onModuleInit() {
    await this.permissions.ensureResource(EResource.PAYMENTS);
  }

  getCurrent(): Promise<{
    processor: PaymentProcessorEntity;
    source: "business" | "env_default";
    stripeEnabled: boolean;
  }> {
    return this.processors.resolveForCurrentBusiness();
  }

  /** Resolve which provider type is active for this request. */
  async resolveType(): Promise<EPaymentProcessorType> {
    const resolved = await this.processors.resolveForCurrentBusiness();
    return resolved.processor.type;
  }

  async createOrGetCustomer(user: UserEntity): Promise<PaymentCustomerResult> {
    return (await this.provider()).createOrGetCustomer(user);
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
    return (await this.provider()).createPaymentIntent(params);
  }

  async listCards(user: UserEntity): Promise<PaymentCardsResult> {
    return (await this.provider()).listCards(user);
  }

  async attachPaymentMethod(
    user: UserEntity,
    paymentMethodId: string,
    setAsDefault?: boolean,
  ): Promise<PaymentCardInfo> {
    return (await this.provider()).attachPaymentMethod(
      user,
      paymentMethodId,
      setAsDefault,
    );
  }

  async detachPaymentMethod(
    user: UserEntity,
    paymentMethodId: string,
  ): Promise<void> {
    return (await this.provider()).detachPaymentMethod(user, paymentMethodId);
  }

  private async provider(): Promise<StripePaymentProvider> {
    const cfg = this.config.getOrThrow<PaymentProcessorsConfig>(
      "paymentProcessors",
    );
    const type = await this.resolveType();

    switch (type) {
      case EPaymentProcessorType.STRIPE: {
        if (!cfg.enabled) {
          throw new ServiceUnavailableException(
            "Stripe payments are disabled (STRIPE_ENABLED≠true)",
          );
        }
        if (!cfg.stripe.secretKey) {
          throw new ServiceUnavailableException(
            "STRIPE_SECRET_KEY is not configured",
          );
        }
        return this.stripe;
      }
      default:
        throw new BadRequestException(
          `Payment processor "${type}" has no provider yet (only Stripe is implemented)`,
        );
    }
  }
}
