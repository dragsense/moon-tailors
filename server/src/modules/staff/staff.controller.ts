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
  createStaffPaymentSchema,
  createStaffSchema,
  EPermissionAction,
  EResource,
  getQuerySchema,
  type IMessageResponse,
  type IPaginatedResponse,
  type IStaff,
  type IStaffSlip,
  staffListQuerySchema,
  staffSlipQuerySchema,
  type TCreateStaffData,
  type TCreateStaffPaymentData,
  type TGetQuery,
  type TStaffListQuery,
  type TStaffSlipQuery,
  type TUpdateStaffData,
  type TUpdateStaffPaymentData,
  updateStaffPaymentSchema,
  updateStaffSchema,
} from "@moon-tailors/contracts";
import { RequirePermissions } from "../../common/auth";
import { ZodValidationPipe } from "../../common/validation";
import { StaffSlipService } from "./staff-slip.service";
import { StaffService } from "./staff.service";

@ApiTags("Staff")
@Controller("staff")
export class StaffController {
  constructor(
    private readonly staffService: StaffService,
    private readonly slips: StaffSlipService,
  ) {}

  @Post()
  @RequirePermissions({
    resource: EResource.STAFF,
    action: EPermissionAction.CREATE,
  })
  create(
    @Body(new ZodValidationPipe(createStaffSchema))
    body: TCreateStaffData,
  ): Promise<IMessageResponse> {
    return this.staffService.create(body);
  }

  @Get()
  @RequirePermissions({
    resource: EResource.STAFF,
    action: EPermissionAction.READ,
  })
  list(
    @Query(new ZodValidationPipe(staffListQuerySchema))
    query: TStaffListQuery,
  ): Promise<IPaginatedResponse<IStaff>> {
    return this.staffService.list(query);
  }

  @Get(":id")
  @RequirePermissions({
    resource: EResource.STAFF,
    action: EPermissionAction.READ,
  })
  get(
    @Param("id") id: string,
    @Query(new ZodValidationPipe(getQuerySchema)) query: TGetQuery,
  ): Promise<IStaff> {
    return this.staffService.get(id, query);
  }

  @Get(":id/slip")
  @RequirePermissions({
    resource: EResource.STAFF,
    action: EPermissionAction.READ,
  })
  slip(
    @Param("id") id: string,
    @Query(new ZodValidationPipe(staffSlipQuerySchema))
    query: TStaffSlipQuery,
  ): Promise<IStaffSlip> {
    return this.staffService.slip(id, query);
  }

  /**
   * The slip as a printable page. Uses `@Res()` directly so the global
   * `BrowserHtmlInterceptor` (which wraps GET+HTML responses in its own debug
   * shell) never touches this body.
   */
  @Get(":id/slip/print")
  @RequirePermissions({
    resource: EResource.STAFF,
    action: EPermissionAction.READ,
  })
  async printSlip(
    @Param("id") id: string,
    @Query(new ZodValidationPipe(staffSlipQuerySchema))
    query: TStaffSlipQuery,
    @Res() res: Response,
  ): Promise<void> {
    res.type("html").send(await this.slips.render(id, query));
  }

  @Patch(":id")
  @RequirePermissions({
    resource: EResource.STAFF,
    action: EPermissionAction.UPDATE,
  })
  update(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(updateStaffSchema))
    body: TUpdateStaffData,
  ): Promise<IMessageResponse> {
    return this.staffService.update(id, body);
  }

  @Post(":id/payments")
  @RequirePermissions({
    resource: EResource.STAFF,
    action: EPermissionAction.UPDATE,
  })
  addPayment(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(createStaffPaymentSchema))
    body: TCreateStaffPaymentData,
  ): Promise<IMessageResponse> {
    return this.staffService.addPayment(id, body);
  }

  @Patch(":id/payments/:paymentId")
  @RequirePermissions({
    resource: EResource.STAFF,
    action: EPermissionAction.UPDATE,
  })
  updatePayment(
    @Param("id") id: string,
    @Param("paymentId") paymentId: string,
    @Body(new ZodValidationPipe(updateStaffPaymentSchema))
    body: TUpdateStaffPaymentData,
  ): Promise<IMessageResponse> {
    return this.staffService.updatePayment(id, paymentId, body);
  }
}
