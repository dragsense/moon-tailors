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
import type {
  IOrder,
  IPaginatedResponse,
  TCreateOrderData,
  TGetQuery,
  TOrderListQuery,
  TReceiveOrderPaymentData,
  TUpdateOrderData,
} from "@moon-tailors/contracts";
import {
  applyMeasurementsToDefaultSchema,
  createOrderSchema,
  EPermissionAction,
  EResource,
  getQuerySchema,
  orderListQuerySchema,
  receiveOrderPaymentSchema,
  updateOrderSchema,
} from "@moon-tailors/contracts";
import { RequirePermissions } from "../../common/auth";
import { ZodValidationPipe } from "../../common/validation";
import { OrdersService } from "./orders.service";

@ApiTags("Orders")
@Controller("orders")
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @RequirePermissions({
    resource: EResource.ORDERS,
    action: EPermissionAction.CREATE,
  })
  create(
    @Body(new ZodValidationPipe(createOrderSchema))
    body: TCreateOrderData,
  ): Promise<IOrder> {
    return this.ordersService.create(body);
  }

  @Get()
  @RequirePermissions({
    resource: EResource.ORDERS,
    action: EPermissionAction.READ,
  })
  list(
    @Query(new ZodValidationPipe(orderListQuerySchema))
    query: TOrderListQuery,
  ): Promise<IPaginatedResponse<IOrder>> {
    return this.ordersService.list(query);
  }

  @Get(":id")
  @RequirePermissions({
    resource: EResource.ORDERS,
    action: EPermissionAction.READ,
  })
  get(
    @Param("id") id: string,
    @Query(new ZodValidationPipe(getQuerySchema)) query: TGetQuery,
  ): Promise<IOrder> {
    return this.ordersService.get(id, query);
  }

  @Patch(":id")
  @RequirePermissions({
    resource: EResource.ORDERS,
    action: EPermissionAction.UPDATE,
  })
  update(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(updateOrderSchema))
    body: TUpdateOrderData,
  ): Promise<IOrder> {
    return this.ordersService.update(id, body);
  }

  @Post(":id/receive-payment")
  @RequirePermissions({
    resource: EResource.ORDERS,
    action: EPermissionAction.UPDATE,
  })
  receivePayment(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(receiveOrderPaymentSchema))
    body: TReceiveOrderPaymentData,
  ): Promise<IOrder> {
    return this.ordersService.receivePayment(id, body);
  }

  @Post(":id/apply-measurements-to-default")
  @RequirePermissions({
    resource: EResource.MEASUREMENTS,
    action: EPermissionAction.UPDATE,
  })
  applyMeasurementsToDefault(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(applyMeasurementsToDefaultSchema))
    _body: Record<string, never>,
  ): Promise<IOrder> {
    return this.ordersService.applyMeasurementsToDefault(id);
  }
}
