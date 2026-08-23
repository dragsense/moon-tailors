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
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import type {
  IMessageResponse,
  IPaginatedResponse,
  TCameraListQuery,
  TCreateCamera,
  TUpdateCamera,
  TUpdateCameraStatus,
} from "@template/contracts";
import {
  cameraListQuerySchema,
  createCameraSchema,
  EPermissionAction,
  EResource,
  updateCameraSchema,
  updateCameraStatusSchema,
} from "@template/contracts";
import { RequirePermissions } from "../../common/auth";
import { ZodValidationPipe } from "../../common/validation";
import { CamerasService } from "./cameras.service";
import { CameraEntity } from "./entities/camera.entity";

@ApiBearerAuth("access-token")
@ApiTags("Cameras")
@Controller("cameras")
export class CamerasController {
  constructor(private readonly camerasService: CamerasService) {}

  @Get()
  @RequirePermissions({
    resource: EResource.VIDEO_STREAM,
    action: EPermissionAction.READ,
  })
  list(
    @Query(new ZodValidationPipe(cameraListQuerySchema))
    query: TCameraListQuery,
  ): Promise<IPaginatedResponse<CameraEntity>> {
    return this.camerasService.list(query);
  }

  @Get(":id")
  @RequirePermissions({
    resource: EResource.VIDEO_STREAM,
    action: EPermissionAction.READ,
  })
  get(@Param("id") id: string): Promise<CameraEntity> {
    return this.camerasService.get(id);
  }

  @Post()
  @RequirePermissions({
    resource: EResource.VIDEO_STREAM,
    action: EPermissionAction.CREATE,
  })
  create(
    @Body(new ZodValidationPipe(createCameraSchema)) body: TCreateCamera,
  ): Promise<IMessageResponse> {
    return this.camerasService.create(body);
  }

  @Patch("status/:id")
  @RequirePermissions({
    resource: EResource.VIDEO_STREAM,
    action: EPermissionAction.UPDATE,
  })
  updateStatus(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(updateCameraStatusSchema))
    body: TUpdateCameraStatus,
  ): Promise<IMessageResponse> {
    return this.camerasService.updateStatus(id, body.isActive);
  }

  @Patch(":id")
  @RequirePermissions({
    resource: EResource.VIDEO_STREAM,
    action: EPermissionAction.UPDATE,
  })
  update(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(updateCameraSchema)) body: TUpdateCamera,
  ): Promise<IMessageResponse> {
    return this.camerasService.update(id, body);
  }

  @Delete(":id")
  @RequirePermissions({
    resource: EResource.VIDEO_STREAM,
    action: EPermissionAction.DELETE,
  })
  remove(@Param("id") id: string): Promise<IMessageResponse> {
    return this.camerasService.remove(id);
  }
}
