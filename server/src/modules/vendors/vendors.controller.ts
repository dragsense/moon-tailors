import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Res,
} from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import type { Response } from "express";
import {
  createVendorPaymentSchema,
  createVendorPurchaseSchema,
  createVendorSchema,
  EPermissionAction,
  EResource,
  type IMessageResponse,
  type IPaginatedResponse,
  type IVendor,
  type IVendorSlip,
  type TCreateVendorData,
  type TCreateVendorPaymentData,
  type TCreateVendorPurchaseData,
  type TUpdateVendorData,
  type TVendorListQuery,
  updateVendorSchema,
  vendorListQuerySchema,
  vendorSlipQuerySchema,
  type TVendorSlipQuery,
} from "@moon-tailors/contracts";
import { RequirePermissions } from "../../common/auth";
import { ZodValidationPipe } from "../../common/validation";
import { VendorSlipService } from "./vendor-slip.service";
import { VendorsService } from "./vendors.service";

@ApiTags("Vendors")
@Controller("vendors")
export class VendorsController {
  constructor(
    private readonly vendorsService: VendorsService,
    private readonly slips: VendorSlipService,
  ) {}

  @Post()
  @RequirePermissions({
    resource: EResource.VENDORS,
    action: EPermissionAction.CREATE,
  })
  create(
    @Body(new ZodValidationPipe(createVendorSchema))
    body: TCreateVendorData,
  ): Promise<IMessageResponse> {
    return this.vendorsService.create(body);
  }

  @Get()
  @RequirePermissions({
    resource: EResource.VENDORS,
    action: EPermissionAction.READ,
  })
  list(
    @Query(new ZodValidationPipe(vendorListQuerySchema))
    query: TVendorListQuery,
  ): Promise<IPaginatedResponse<IVendor>> {
    return this.vendorsService.list(query);
  }

  @Get(":id")
  @RequirePermissions({
    resource: EResource.VENDORS,
    action: EPermissionAction.READ,
  })
  get(@Param("id") id: string): Promise<IVendor> {
    return this.vendorsService.get(id);
  }

  @Get(":id/slip")
  @RequirePermissions({
    resource: EResource.VENDORS,
    action: EPermissionAction.READ,
  })
  slip(
    @Param("id") id: string,
    @Query(new ZodValidationPipe(vendorSlipQuerySchema))
    query: TVendorSlipQuery,
  ): Promise<IVendorSlip> {
    return this.vendorsService.slip(id, query);
  }

  /**
   * The statement as a printable page. Uses `@Res()` directly so the global
   * `BrowserHtmlInterceptor` (which wraps GET+HTML responses in its own debug
   * shell) never touches this body.
   */
  @Get(":id/slip/print")
  @RequirePermissions({
    resource: EResource.VENDORS,
    action: EPermissionAction.READ,
  })
  async printSlip(
    @Param("id") id: string,
    @Query(new ZodValidationPipe(vendorSlipQuerySchema))
    query: TVendorSlipQuery,
    @Res() res: Response,
  ): Promise<void> {
    res.type("html").send(await this.slips.render(id, query));
  }

  @Patch(":id")
  @RequirePermissions({
    resource: EResource.VENDORS,
    action: EPermissionAction.UPDATE,
  })
  update(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(updateVendorSchema))
    body: TUpdateVendorData,
  ): Promise<IMessageResponse> {
    return this.vendorsService.update(id, body);
  }

  @Post(":id/purchases")
  @RequirePermissions({
    resource: EResource.VENDORS,
    action: EPermissionAction.UPDATE,
  })
  addPurchase(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(createVendorPurchaseSchema))
    body: TCreateVendorPurchaseData,
  ): Promise<IMessageResponse> {
    return this.vendorsService.addPurchase(id, body);
  }

  @Post(":id/payments")
  @RequirePermissions({
    resource: EResource.VENDORS,
    action: EPermissionAction.UPDATE,
  })
  addPayment(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(createVendorPaymentSchema))
    body: TCreateVendorPaymentData,
  ): Promise<IMessageResponse> {
    return this.vendorsService.addPayment(id, body);
  }
}
