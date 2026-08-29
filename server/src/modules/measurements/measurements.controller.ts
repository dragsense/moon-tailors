import { Body, Controller, Get, Param, Patch } from "@nestjs/common";
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
  constructor(private readonly measurements: MeasurementsService) {}

  /** Update customer’s usual measurement. */
  @Patch("customers/:customerId")
  @RequirePermissions({
    resource: EResource.MEASUREMENTS,
    action: EPermissionAction.UPDATE,
  })
  upsertDefault(
    @Param("customerId") customerId: string,
    @Body(new ZodValidationPipe(updateMeasurementSchema))
    body: TUpdateMeasurementData,
  ): Promise<IMeasurement> {
    return this.measurements.upsertDefault(customerId, body);
  }

  @Get(":id")
  @RequirePermissions({
    resource: EResource.MEASUREMENTS,
    action: EPermissionAction.READ,
  })
  getOne(@Param("id") id: string): Promise<IMeasurement> {
    return this.measurements.getOne(id);
  }

  /** Update by id (usual or order snapshot). */
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
    return this.measurements.update(id, body);
  }
}
