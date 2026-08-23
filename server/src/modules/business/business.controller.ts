import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import {
  businessListQuerySchema,
  createBusinessSchema,
  EPermissionAction,
  EResource,
  EUserLevel,
  type IPaginatedResponse,
  type TBusinessListQuery,
  type TCreateBusinessData,
} from "@template/contracts";
import {
  CurrentUser,
  RequirePermissions,
  RequireUserLevels,
} from "../../common/auth";
import { ZodValidationPipe } from "../../common/validation";
import type { BusinessEntity, UserEntity } from "../../common/base";
import { BusinessService } from "./business.service";
import { z } from "zod";

const setPaymentProcessorSchema = z.object({
  paymentProcessorId: z.string().uuid().nullable(),
});

const setAiProcessorSchema = z.object({
  aiProcessorId: z.string().uuid().nullable(),
});

@ApiTags("Businesses")
@Controller("businesses")
@RequireUserLevels(
  EUserLevel.PLATFORM_OWNER,
  EUserLevel.SUPER_ADMIN,
  EUserLevel.ADMIN,
)
export class BusinessController {
  constructor(private readonly businesses: BusinessService) {}

  @Post()
  @RequirePermissions({
    resource: EResource.BUSINESSES,
    action: EPermissionAction.CREATE,
  })
  create(
    @Body(new ZodValidationPipe(createBusinessSchema)) body: TCreateBusinessData,
    @CurrentUser() user: UserEntity,
  ): Promise<BusinessEntity> {
    return this.businesses.create(body, user.id);
  }

  @Get()
  @RequirePermissions({
    resource: EResource.BUSINESSES,
    action: EPermissionAction.READ,
  })
  list(
    @Query(new ZodValidationPipe(businessListQuerySchema))
    query: TBusinessListQuery,
  ): Promise<IPaginatedResponse<BusinessEntity>> {
    return this.businesses.list(query);
  }

  @Get(":id")
  @RequirePermissions({
    resource: EResource.BUSINESSES,
    action: EPermissionAction.READ,
  })
  get(@Param("id") id: string): Promise<BusinessEntity> {
    return this.businesses.get(id);
  }

  @Patch(":id/payment-processor")
  @RequirePermissions({
    resource: EResource.BUSINESSES,
    action: EPermissionAction.UPDATE,
  })
  setPaymentProcessor(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(setPaymentProcessorSchema))
    body: z.infer<typeof setPaymentProcessorSchema>,
  ): Promise<BusinessEntity> {
    return this.businesses.setPaymentProcessor(id, body.paymentProcessorId);
  }

  @Patch(":id/ai-processor")
  @RequirePermissions({
    resource: EResource.BUSINESSES,
    action: EPermissionAction.UPDATE,
  })
  setAiProcessor(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(setAiProcessorSchema))
    body: z.infer<typeof setAiProcessorSchema>,
  ): Promise<BusinessEntity> {
    return this.businesses.setAiProcessor(id, body.aiProcessorId);
  }
}
