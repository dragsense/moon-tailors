import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Stripe from "stripe";
import type { PaymentProcessorsConfig } from "../../../config";
import type { UserEntity } from "../../../common/base";
import {
  EntityService,
  type IBoundEntityService,
} from "../../../common/database";
import type { EntityQueryConfig } from "../../../common/query";
import { StripeConnectAccountEntity } from "../entities/stripe-connect-account.entity";

export const STRIPE_CONNECT_QUERY: EntityQueryConfig = {
  alias: "stripeConnect",
  sortable: ["createdAt"],
  defaultSort: { field: "createdAt", order: "DESC" },
};

@Injectable()
export class StripeConnectService {
  private readonly logger = new Logger(StripeConnectService.name);
  private readonly entity: IBoundEntityService<StripeConnectAccountEntity>;
  private readonly stripe: Stripe | null;

  constructor(
    private readonly entityService: EntityService,
    private readonly config: ConfigService,
  ) {
    this.entity = this.entityService.bind(
      StripeConnectAccountEntity,
      STRIPE_CONNECT_QUERY,
    );
    const key = this.config.getOrThrow<PaymentProcessorsConfig>(
      "paymentProcessors",
    ).stripe.secretKey;
    this.stripe = key ? new Stripe(key) : null;
  }

  private client(): Stripe {
    if (!this.stripe) {
      throw new BadRequestException("Stripe is not configured");
    }
    return this.stripe;
  }

  async connectAccount(user: UserEntity, country = "US") {
    let row = await this.entity.get(
      { userId: user.id },
      { access: { type: "eq", column: "userId", value: user.id } },
    );
    if (!row) {
      const account = await this.client().accounts.create({
        type: "express",
        country,
        email: user.email,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        metadata: { userId: user.id },
      });
      row = await this.entity.create({
        userId: user.id,
        accountId: account.id,
        chargesEnabled: false,
        detailsSubmitted: false,
      });
    }

    const link = await this.client().accountLinks.create({
      account: row.accountId,
      refresh_url: `${process.env.APP_URL ?? "http://localhost:8088/app"}/payments/connect/refresh`,
      return_url: `${process.env.APP_URL ?? "http://localhost:8088/app"}/payments/connect/return`,
      type: "account_onboarding",
    });

    return {
      id: row.id,
      accountId: row.accountId,
      chargesEnabled: row.chargesEnabled,
      detailsSubmitted: row.detailsSubmitted,
      onboardingUrl: link.url,
    };
  }

  async getAccount(userId: string) {
    const row = await this.entity.get(
      { userId },
      { access: { type: "eq", column: "userId", value: userId } },
    );
    if (!row) throw new NotFoundException("Connect account not found");
    const remote = await this.client().accounts.retrieve(row.accountId);
    const updated = await this.entity.update(row.id, {
      chargesEnabled: Boolean(remote.charges_enabled),
      detailsSubmitted: Boolean(remote.details_submitted),
    });
    return {
      id: updated.id,
      accountId: updated.accountId,
      chargesEnabled: updated.chargesEnabled,
      detailsSubmitted: updated.detailsSubmitted,
      onboardingUrl: null as string | null,
    };
  }

  async loginLink(userId: string) {
    const row = await this.entity.get(
      { userId },
      { access: { type: "eq", column: "userId", value: userId } },
    );
    if (!row) throw new NotFoundException("Connect account not found");
    const link = await this.client().accounts.createLoginLink(row.accountId);
    return { url: link.url };
  }

  async findAccountIdByUser(userId: string): Promise<string | undefined> {
    const row = await this.entity.get(
      { userId },
      { access: { type: "eq", column: "userId", value: userId } },
    );
    return row?.accountId;
  }
}
