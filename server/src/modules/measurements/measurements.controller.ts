import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
} from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import type {
  IMeasurement,
  TUpdateMeasurementData,
} from "@moon-tailors/contracts";
import {
  EPermissionAction,
  EResource,
  updateMeasurementSchema,
} from "@moon-tailors/contracts";
import { RequirePermissions } from "../../common/auth";
import { ZodValidationPipe } from "../../common/validation";
import { MeasurementsService } from "./measurements.service";

@ApiTags("Measurements")
@Controller("measurements")
export class MeasurementsController {
  constructor(private readonly measurementsService: MeasurementsService) {}

  /** Upsert a customer’s usual measurement (when you only have customerId). */
  @Patch("customers/:customerId")
  @RequirePermissions({
    resource: EResource.MEASUREMENTS,
    action: EPermissionAction.UPDATE,
  })
  upsertCustomerDefault(
    @Param("customerId") customerId: string,
    @Body(new ZodValidationPipe(updateMeasurementSchema))
    body: TUpdateMeasurementData,
  ): Promise<IMeasurement> {
    return this.measurementsService.upsertCustomerDefault(customerId, body);
  }

  /** GET /measurements/:id */
  @Get(":id")
  @RequirePermissions({
    resource: EResource.MEASUREMENTS,
    action: EPermissionAction.READ,
  })
  getOne(@Param("id") id: string): Promise<IMeasurement> {
    return this.measurementsService.getById(id);
  }

  /** Update by measurement id (customer default or order snapshot). */
  @Patch(":id")
  @RequirePermissions({
    resource: EResource.MEASUREMENTS,
    action: EPermissionAction.UPDATE,
  })
  update(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(updateMeasurementSchema))
    body: TUpdateMeasurementData,
  ): Promise<IMeasurement> {
    return this.measurementsService.updateById(id, body);
  }
}
