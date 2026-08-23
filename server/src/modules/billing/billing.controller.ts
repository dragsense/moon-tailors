import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import {
  EPermissionAction,
  EResource,
  createBillingSchema,
  billingListQuerySchema,
  updateBillingSchema,
  type IMessageResponse,
  type IPaginatedResponse,
  type TBillingListQuery,
  type TCreateBilling,
  type TUpdateBilling,
} from "@template/contracts";
import { RequirePermissions } from "../../common/auth";
import { ZodValidationPipe } from "../../common/validation";
import { BillingService } from "./billing.service";
import { BillingEntity } from "./entities/billing.entity";

@ApiTags("Billings")
@Controller("billings")
export class BillingController {
  constructor(private readonly billings: BillingService) {}

  @Post()
  @RequirePermissions({
    resource: EResource.BILLINGS,
    action: EPermissionAction.CREATE,
  })
  create(
    @Body(new ZodValidationPipe(createBillingSchema)) body: TCreateBilling,
  ): Promise<IMessageResponse> {
    return this.billings.create(body);
  }

  @Get()
  @RequirePermissions({
    resource: EResource.BILLINGS,
    action: EPermissionAction.READ,
  })
  list(
    @Query(new ZodValidationPipe(billingListQuerySchema))
    query: TBillingListQuery,
  ): Promise<IPaginatedResponse<BillingEntity>> {
    return this.billings.list(query);
  }

  @Get(":id")
  @RequirePermissions({
    resource: EResource.BILLINGS,
    action: EPermissionAction.READ,
  })
  get(@Param("id") id: string): Promise<BillingEntity> {
    return this.billings.get(id);
  }

  @Patch(":id")
  @RequirePermissions({
    resource: EResource.BILLINGS,
    action: EPermissionAction.UPDATE,
  })
  update(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(updateBillingSchema)) body: TUpdateBilling,
  ): Promise<IMessageResponse> {
    return this.billings.update(id, body);
  }

  @Delete(":id")
  @RequirePermissions({
    resource: EResource.BILLINGS,
    action: EPermissionAction.DELETE,
  })
  remove(@Param("id") id: string): Promise<IMessageResponse> {
    return this.billings.remove(id);
  }
}
