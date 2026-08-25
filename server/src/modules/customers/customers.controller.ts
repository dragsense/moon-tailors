import { Body, Controller, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import type {
  ICustomer,
  IPaginatedResponse,
  TCopyCustomerMeasurementData,
  TCreateCustomerData,
  TCustomerListQuery,
  TMeasurementValues,
  TUpdateCustomerData,
} from "@moon-tailors/contracts";
import {
  copyCustomerMeasurementSchema,
  createCustomerSchema,
  customerListQuerySchema,
  EPermissionAction,
  EResource,
  updateCustomerSchema,
  updateMeasurementSchema,
} from "@moon-tailors/contracts";
import { RequirePermissions } from "../../common/auth";
import { ZodValidationPipe } from "../../common/validation";
import { CustomersService } from "./customers.service";

@ApiTags("Customers")
@Controller("customers")
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Post()
  @RequirePermissions({
    resource: EResource.CUSTOMERS,
    action: EPermissionAction.CREATE,
  })
  create(
    @Body(new ZodValidationPipe(createCustomerSchema))
    body: TCreateCustomerData,
  ): Promise<ICustomer> {
    return this.customersService.create(body);
  }

  @Get()
  @RequirePermissions({
    resource: EResource.CUSTOMERS,
    action: EPermissionAction.READ,
  })
  list(
    @Query(new ZodValidationPipe(customerListQuerySchema))
    query: TCustomerListQuery,
  ): Promise<IPaginatedResponse<ICustomer>> {
    return this.customersService.list(query);
  }

  @Get(":id")
  @RequirePermissions({
    resource: EResource.CUSTOMERS,
    action: EPermissionAction.READ,
  })
  get(@Param("id") id: string): Promise<ICustomer> {
    return this.customersService.get(id);
  }

  @Patch(":id")
  @RequirePermissions({
    resource: EResource.CUSTOMERS,
    action: EPermissionAction.UPDATE,
  })
  update(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(updateCustomerSchema))
    body: TUpdateCustomerData,
  ): Promise<ICustomer> {
    return this.customersService.update(id, body);
  }

  @Patch(":id/measurements/:garmentTypeId")
  @RequirePermissions({
    resource: EResource.MEASUREMENTS,
    action: EPermissionAction.UPDATE,
  })
  upsertMeasurement(
    @Param("id") id: string,
    @Param("garmentTypeId") garmentTypeId: string,
    @Body(new ZodValidationPipe(updateMeasurementSchema))
    body: TMeasurementValues,
  ): Promise<ICustomer> {
    return this.customersService.upsertMeasurement(id, garmentTypeId, body);
  }

  @Post(":id/measurements/copy")
  @RequirePermissions({
    resource: EResource.MEASUREMENTS,
    action: EPermissionAction.UPDATE,
  })
  copyMeasurement(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(copyCustomerMeasurementSchema))
    body: TCopyCustomerMeasurementData,
  ): Promise<ICustomer> {
    return this.customersService.copyMeasurement(id, body);
  }
}
