import { Body, Controller, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import {
  createStaffSchema,
  EPermissionAction,
  EResource,
  getQuerySchema,
  type IMessageResponse,
  type IPaginatedResponse,
  type IStaff,
  staffLeaveSchema,
  staffListQuerySchema,
  staffRejoinSchema,
  staffSalarySchema,
  type TCreateStaffData,
  type TGetQuery,
  type TStaffLeaveData,
  type TStaffListQuery,
  type TStaffRejoinData,
  type TStaffSalaryData,
  type TUpdateStaffData,
  updateStaffSchema,
} from "@moon-tailors/contracts";
import { RequirePermissions } from "../../common/auth";
import { ZodValidationPipe } from "../../common/validation";
import { StaffService } from "./staff.service";

@ApiTags("Staff")
@Controller("staff")
export class StaffController {
  constructor(private readonly staffService: StaffService) {}

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

  @Patch(":id/salary")
  @RequirePermissions({
    resource: EResource.STAFF,
    action: EPermissionAction.UPDATE,
  })
  changeSalary(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(staffSalarySchema))
    body: TStaffSalaryData,
  ): Promise<IMessageResponse> {
    return this.staffService.changeSalary(id, body);
  }

  @Post(":id/leave")
  @RequirePermissions({
    resource: EResource.STAFF,
    action: EPermissionAction.UPDATE,
  })
  leave(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(staffLeaveSchema))
    body: TStaffLeaveData,
  ): Promise<IMessageResponse> {
    return this.staffService.leave(id, body);
  }

  @Post(":id/rejoin")
  @RequirePermissions({
    resource: EResource.STAFF,
    action: EPermissionAction.UPDATE,
  })
  rejoin(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(staffRejoinSchema))
    body: TStaffRejoinData,
  ): Promise<IMessageResponse> {
    return this.staffService.rejoin(id, body);
  }
}
