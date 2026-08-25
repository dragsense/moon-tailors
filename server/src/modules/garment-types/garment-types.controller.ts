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
import type {
  IGarmentType,
  IMessageResponse,
  IPaginatedResponse,
  TCreateGarmentTypeData,
  TGarmentTypeListQuery,
  TUpdateGarmentTypeData,
} from "@moon-tailors/contracts";
import {
  createGarmentTypeSchema,
  EPermissionAction,
  EResource,
  garmentTypeListQuerySchema,
  updateGarmentTypeSchema,
} from "@moon-tailors/contracts";
import { RequirePermissions } from "../../common/auth";
import { ZodValidationPipe } from "../../common/validation";
import { GarmentTypesService } from "./garment-types.service";

@ApiTags("Garment types")
@Controller("garment-types")
export class GarmentTypesController {
  constructor(private readonly garmentTypesService: GarmentTypesService) {}

  @Post()
  @RequirePermissions({
    resource: EResource.GARMENT_TYPES,
    action: EPermissionAction.CREATE,
  })
  create(
    @Body(new ZodValidationPipe(createGarmentTypeSchema))
    body: TCreateGarmentTypeData,
  ): Promise<IGarmentType> {
    return this.garmentTypesService.create(body);
  }

  @Get()
  @RequirePermissions({
    resource: EResource.GARMENT_TYPES,
    action: EPermissionAction.READ,
  })
  list(
    @Query(new ZodValidationPipe(garmentTypeListQuerySchema))
    query: TGarmentTypeListQuery,
  ): Promise<IPaginatedResponse<IGarmentType>> {
    return this.garmentTypesService.list(query);
  }

  @Get(":id")
  @RequirePermissions({
    resource: EResource.GARMENT_TYPES,
    action: EPermissionAction.READ,
  })
  get(@Param("id") id: string): Promise<IGarmentType> {
    return this.garmentTypesService.get(id);
  }

  @Patch(":id")
  @RequirePermissions({
    resource: EResource.GARMENT_TYPES,
    action: EPermissionAction.UPDATE,
  })
  update(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(updateGarmentTypeSchema))
    body: TUpdateGarmentTypeData,
  ): Promise<IGarmentType> {
    return this.garmentTypesService.update(id, body);
  }

  @Delete(":id")
  @RequirePermissions({
    resource: EResource.GARMENT_TYPES,
    action: EPermissionAction.DELETE,
  })
  remove(@Param("id") id: string): Promise<IMessageResponse> {
    return this.garmentTypesService.remove(id);
  }
}
