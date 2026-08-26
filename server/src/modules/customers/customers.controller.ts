import { Body, Controller, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import type {
  ICustomer,
  IPaginatedResponse,
  TCreateCustomerData,
  TCustomerListQuery,
  TUpdateCustomerData,
} from "@moon-tailors/contracts";
import {
  createCustomerSchema,
  customerListQuerySchema,
  EPermissionAction,
  EResource,
  updateCustomerSchema,
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
}
