import {
  BadRequestException,
  Body,
  Controller,
  Param,
  Post,
} from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import {
  EPermissionAction,
  EResource,
  payBillingSchema,
  type TPayBilling,
} from "@template/contracts";
import { CurrentUser, RequirePermissions } from "../../../common/auth";
import { UserEntity } from "../../../common/base";
import { ZodValidationPipe } from "../../../common/validation";
import { PaymentAdapterService } from "../../payment-adapter/payment-adapter.service";
import { BillingService } from "../billing.service";
import { BillingEntity } from "../entities/billing.entity";

@ApiTags("Billings")
@Controller("billings")
export class BillingPayController {
  constructor(
    private readonly billings: BillingService,
    private readonly payments: PaymentAdapterService,
  ) {}

  @Post(":id/pay")
  @RequirePermissions({
    resource: EResource.BILLINGS,
    action: EPermissionAction.UPDATE,
  })
  async pay(
    @Param("id") id: string,
    @CurrentUser() user: UserEntity,
    @Body(new ZodValidationPipe(payBillingSchema)) body: TPayBilling,
  ): Promise<BillingEntity> {
    const billing = await this.billings.get(id);
    const remaining = billing.amountCents - billing.paidAmountCents;
    if (remaining <= 0) {
      throw new BadRequestException("Billing already paid");
    }

    const customer = await this.payments.createOrGetCustomer(user);
    const intent = await this.payments.createPaymentIntent({
      amountCents: remaining,
      customerId: customer.customerId,
      paymentMethodId: body.paymentMethodId,
      confirm: true,
      metadata: { billingId: billing.id },
      applicationFeeAmount: body.applicationFeeAmountCents,
    });

    return this.billings.markPaid(billing.id, billing.amountCents, intent.id);
  }
}
