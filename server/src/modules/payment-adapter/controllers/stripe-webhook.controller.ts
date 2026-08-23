import {
  Controller,
  Headers,
  Logger,
  Post,
  Req,
  BadRequestException,
  Inject,
  forwardRef,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { ApiTags } from "@nestjs/swagger";
import type { Request } from "express";
import Stripe from "stripe";
import type { PaymentProcessorsConfig } from "../../../config";
import { Public } from "../../../common/auth";
import { SkipCsrf, SkipEncryption } from "../../../common/security";
import { BillingService } from "../../billing/billing.service";

@ApiTags("Stripe webhook")
@Controller("payments/stripe")
export class StripeWebhookController {
  private readonly logger = new Logger(StripeWebhookController.name);

  constructor(
    private readonly config: ConfigService,
    @Inject(forwardRef(() => BillingService))
    private readonly billings: BillingService,
  ) {}

  @Public()
  @SkipCsrf()
  @SkipEncryption()
  @Post("webhook")
  async handle(
    @Req() req: Request & { rawBody?: Buffer },
    @Headers("stripe-signature") signature: string | undefined,
  ) {
    const cfg = this.config.getOrThrow<PaymentProcessorsConfig>(
      "paymentProcessors",
    ).stripe;
    if (!cfg.secretKey || !cfg.webhookSecret) {
      throw new BadRequestException("Stripe webhook not configured");
    }
    if (!signature) throw new BadRequestException("Missing stripe-signature");

    const stripe = new Stripe(cfg.secretKey);

    const payload = req.rawBody;
    if (!payload) {
      throw new BadRequestException(
        "Raw body required for Stripe webhooks (enable rawBody on NestFactory)",
      );
    }

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(
        payload,
        signature,
        cfg.webhookSecret,
      );
    } catch (error) {
      this.logger.error("Webhook signature verification failed", error);
      throw new BadRequestException("Invalid signature");
    }

    if (
      event.type === "payment_intent.succeeded" ||
      event.type === "payment_intent.payment_failed" ||
      event.type === "payment_intent.processing"
    ) {
      const intent = event.data.object as Stripe.PaymentIntent;
      const billingId = intent.metadata?.billingId;
      if (billingId) {
        if (event.type === "payment_intent.succeeded") {
          await this.billings.markPaid(
            billingId,
            intent.amount_received || intent.amount,
            intent.id,
          );
        } else if (event.type === "payment_intent.payment_failed") {
          await this.billings.markFailed(billingId, intent.id);
        }
      }
    }

    return { received: true };
  }
}
