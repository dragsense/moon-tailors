import {
  forwardRef,
  Inject,
  Injectable,
  OnModuleInit,
} from "@nestjs/common";
import {
  EResource,
  cameraListQuerySchema,
  filtersFromListSchema,
  type IMessageResponse,
  type IPaginatedResponse,
  type TCameraListQuery,
  type TCreateCamera,
  type TUpdateCamera,
} from "@template/contracts";
import { PermissionsService } from "../../common/base";
import {
  EntityService,
  type IBoundEntityService,
} from "../../common/database";
import type { EntityKey, EntityQueryConfig } from "../../common/query";
import { CameraEntity } from "./entities/camera.entity";
import { StreamsService } from "./streams/streams.service";

export const CAMERA_QUERY: EntityQueryConfig = {
  alias: "camera",
  restrictedFields: ["password"],
  searchable: ["name", "description", "ipAddress"],
  sortable: ["createdAt", "name", "isActive"],
  defaultSort: { field: "createdAt", order: "DESC" },
  filters: filtersFromListSchema(cameraListQuerySchema),
};

@Injectable()
export class CamerasService implements OnModuleInit {
  private readonly entity: IBoundEntityService<CameraEntity>;

  constructor(
    private readonly entityService: EntityService,
    private readonly permissions: PermissionsService,
    @Inject(forwardRef(() => StreamsService))
    private readonly streamsService: StreamsService,
  ) {
    this.entity = this.entityService.bind(CameraEntity, CAMERA_QUERY);
  }

  async onModuleInit() {
    await this.permissions.ensureResource(EResource.VIDEO_STREAM);
  }

  /** Includes password — backend / MediaMTX only. */
  async getCameraForStreaming(cameraId: string): Promise<CameraEntity | null> {
    return this.entity
      .getRepository()
      .createQueryBuilder("camera")
      .addSelect("camera.password")
      .where("camera.id = :id", { id: cameraId })
      .andWhere("camera.deletedAt IS NULL")
      .getOne();
  }

  async create(input: TCreateCamera): Promise<IMessageResponse> {
    await this.entity.create({
      name: input.name.trim(),
      description: input.description?.trim() || null,
      protocol: input.protocol,
      username: input.username?.trim() || null,
      password: input.password?.trim() || null,
      ipAddress: input.ipAddress.trim(),
      port: input.port ?? 554,
      path: input.path?.trim() || null,
      isActive: input.isActive ?? true,
    });
    return { message: "Camera created" };
  }

  async update(
    key: EntityKey,
    input: TUpdateCamera,
  ): Promise<IMessageResponse> {
    const patch: Partial<CameraEntity> = {};
    if (input.name !== undefined) patch.name = input.name.trim();
    if (input.description !== undefined) {
      patch.description = input.description?.trim() || null;
    }
    if (input.protocol !== undefined) patch.protocol = input.protocol;
    if (input.username !== undefined) {
      patch.username = input.username?.trim() || null;
    }
    if (input.password !== undefined && input.password.trim() !== "") {
      patch.password = input.password.trim();
    }
    if (input.ipAddress !== undefined) patch.ipAddress = input.ipAddress.trim();
    if (input.port !== undefined) patch.port = input.port ?? null;
    if (input.path !== undefined) patch.path = input.path?.trim() || null;
    if (input.isActive !== undefined) patch.isActive = input.isActive;

    await this.entity.update(key, patch);
    if (input.isActive === false) {
      await this.streamsService.removeCameraPath(String(key));
    }
    return { message: "Camera updated" };
  }

  async updateStatus(
    key: EntityKey,
    isActive: boolean,
  ): Promise<IMessageResponse> {
    await this.entity.update(key, { isActive });
    if (!isActive) {
      await this.streamsService.removeCameraPath(String(key));
    }
    return { message: "Camera status updated" };
  }

  list(query: TCameraListQuery): Promise<IPaginatedResponse<CameraEntity>> {
    return this.entity.list(query);
  }

  get(key: EntityKey): Promise<CameraEntity> {
    return this.entity.require(key);
  }

  async remove(key: EntityKey): Promise<IMessageResponse> {
    await this.entity.softDelete(key);
    await this.streamsService.removeCameraPath(String(key));
    return { message: "Camera deleted successfully" };
  }
}
