import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
} from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import {
  EPermissionAction,
  EResource,
  addPaymentCardSchema,
  createPaymentIntentSchema,
  type IPaymentCardsResponse,
  type IPaymentIntentResult,
  type TAddPaymentCard,
  type TCreatePaymentIntent,
} from "@template/contracts";
import { CurrentUser, RequirePermissions } from "../../../common/auth";
import { UserEntity } from "../../../common/base";
import { ZodValidationPipe } from "../../../common/validation";
import { PaymentAdapterService } from "../payment-adapter.service";

@ApiTags("Payments")
@Controller("payments")
export class PaymentCardsController {
  constructor(private readonly payments: PaymentAdapterService) {}

  @Get("current")
  @RequirePermissions({
    resource: EResource.PAYMENTS,
    action: EPermissionAction.READ,
  })
  current() {
    return this.payments.getCurrent();
  }

  @Get("cards")
  @RequirePermissions({
    resource: EResource.PAYMENTS,
    action: EPermissionAction.READ,
  })
  listCards(@CurrentUser() user: UserEntity): Promise<IPaymentCardsResponse> {
    return this.payments.listCards(user);
  }

  @Post("cards")
  @RequirePermissions({
    resource: EResource.PAYMENTS,
    action: EPermissionAction.CREATE,
  })
  addCard(
    @CurrentUser() user: UserEntity,
    @Body(new ZodValidationPipe(addPaymentCardSchema)) body: TAddPaymentCard,
  ) {
    return this.payments.attachPaymentMethod(
      user,
      body.paymentMethodId,
      body.setAsDefault ?? true,
    );
  }

  @Delete("cards/:paymentMethodId")
  @RequirePermissions({
    resource: EResource.PAYMENTS,
    action: EPermissionAction.DELETE,
  })
  async removeCard(
    @CurrentUser() user: UserEntity,
    @Param("paymentMethodId") paymentMethodId: string,
  ) {
    await this.payments.detachPaymentMethod(user, paymentMethodId);
    return { message: "Card removed" };
  }

  @Post("payment-intents")
  @RequirePermissions({
    resource: EResource.PAYMENTS,
    action: EPermissionAction.CREATE,
  })
  async createIntent(
    @CurrentUser() user: UserEntity,
    @Body(new ZodValidationPipe(createPaymentIntentSchema))
    body: TCreatePaymentIntent,
  ): Promise<IPaymentIntentResult> {
    const customer = await this.payments.createOrGetCustomer(user);
    const intent = await this.payments.createPaymentIntent({
      amountCents: body.amountCents,
      customerId: customer.customerId,
      paymentMethodId: body.paymentMethodId,
      currency: body.currency,
      confirm: body.confirm,
      metadata: body.metadata,
      applicationFeeAmount: body.applicationFeeAmountCents,
    });
    return {
      id: intent.id,
      status: intent.status,
      clientSecret: intent.clientSecret ?? null,
    };
  }
}
