import { Controller, Get, Post } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import {
  EPermissionAction,
  EResource,
  type IStripeConnectAccount,
  type IStripeConnectLink,
} from "@template/contracts";
import { CurrentUser, RequirePermissions } from "../../../common/auth";
import { UserEntity } from "../../../common/base";
import { StripeConnectService } from "../services/stripe-connect.service";

@ApiTags("Stripe Connect")
@Controller("payments/connect")
export class StripeConnectController {
  constructor(private readonly connectService: StripeConnectService) {}

  @Post()
  @RequirePermissions({
    resource: EResource.PAYMENTS,
    action: EPermissionAction.MANAGE,
  })
  connect(
    @CurrentUser() user: UserEntity,
  ): Promise<IStripeConnectAccount> {
    return this.connectService.connectAccount(user);
  }

  @Get()
  @RequirePermissions({
    resource: EResource.PAYMENTS,
    action: EPermissionAction.READ,
  })
  status(@CurrentUser() user: UserEntity): Promise<IStripeConnectAccount> {
    return this.connectService.getAccount(user.id);
  }

  @Post("login-link")
  @RequirePermissions({
    resource: EResource.PAYMENTS,
    action: EPermissionAction.READ,
  })
  loginLink(@CurrentUser() user: UserEntity): Promise<IStripeConnectLink> {
    return this.connectService.loginLink(user.id);
  }
}
