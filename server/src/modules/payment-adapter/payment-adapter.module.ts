import { Module, forwardRef } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { PermissionsModule } from "../../common/base";
import { PaymentProcessorsModule } from "../../common/payment-processors";
import { BillingModule } from "../billing/billing.module";
import { PaymentCardsController } from "./controllers/payment-cards.controller";
import { StripeConnectController } from "./controllers/stripe-connect.controller";
import { StripeWebhookController } from "./controllers/stripe-webhook.controller";
import { PaymentCustomerEntity } from "./entities/payment-customer.entity";
import { StripeConnectAccountEntity } from "./entities/stripe-connect-account.entity";
import { PaymentAdapterService } from "./payment-adapter.service";
import { StripeConnectService } from "./services/stripe-connect.service";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PaymentCustomerEntity,
      StripeConnectAccountEntity,
    ]),
    PermissionsModule,
    PaymentProcessorsModule,
    forwardRef(() => BillingModule),
  ],
  controllers: [
    PaymentCardsController,
    StripeConnectController,
    StripeWebhookController,
  ],
  providers: [PaymentAdapterService, StripeConnectService],
  exports: [PaymentAdapterService, StripeConnectService],
})
export class PaymentAdapterModule {}
