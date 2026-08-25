import { ConflictException, Injectable, OnModuleInit } from "@nestjs/common";
import type {
  IGarmentType,
  IMessageResponse,
  IPaginatedResponse,
  TCreateGarmentTypeData,
  TGarmentTypeListQuery,
  TUpdateGarmentTypeData,
} from "@moon-tailors/contracts";
import {
  EGarmentAudience,
  EResource,
  filtersFromListSchema,
  garmentTypeListQuerySchema,
  makeGarmentTypeSlug,
  SYSTEM_GARMENT_TYPES,
} from "@moon-tailors/contracts";
import { PermissionsService } from "../../common/base";
import {
  EntityService,
  type IBoundEntityService,
} from "../../common/database";
import type { EntityKey, EntityQueryConfig } from "../../common/query";
import { IsNull } from "typeorm";
import { MeasurementEntity } from "../measurements/entities/measurement.entity";
import { GarmentTypeEntity } from "./entities/garment-type.entity";

export type TSystemGarmentTypeSeed = (typeof SYSTEM_GARMENT_TYPES)[number];

export const GARMENT_TYPE_QUERY: EntityQueryConfig = {
  alias: "garmentType",
  searchable: ["name", "slug"],
  sortable: ["sortOrder", "name", "createdAt"],
  defaultSort: { field: "sortOrder", order: "ASC" },
  filters: filtersFromListSchema(garmentTypeListQuerySchema),
};

@Injectable()
export class GarmentTypesService implements OnModuleInit {
  private readonly entity: IBoundEntityService<GarmentTypeEntity>;

  constructor(
    private readonly entityService: EntityService,
    private readonly permissions: PermissionsService,
  ) {
    this.entity = this.entityService.bind(
      GarmentTypeEntity,
      GARMENT_TYPE_QUERY,
    );
  }

  async onModuleInit() {
    await this.permissions.ensureResource(EResource.GARMENT_TYPES);
  }

  async list(
    query: TGarmentTypeListQuery,
  ): Promise<IPaginatedResponse<IGarmentType>> {
    const page = await this.entity.list({
      ...query,
      limit: query.limit ?? 100,
    });
    return { ...page, data: page.data.map((row) => this.toPayload(row)) };
  }

  async get(key: EntityKey): Promise<IGarmentType> {
    const row = await this.entity.require(key);
    return this.toPayload(row);
  }

  async create(input: TCreateGarmentTypeData): Promise<IGarmentType> {
    const audience = input.audience ?? EGarmentAudience.GENTS;
    const slug = await this.uniqueSlug(
      makeGarmentTypeSlug(audience, input.name),
    );
    const row = await this.entity.create({
      slug,
      name: input.name,
      audience,
      sortOrder: input.sortOrder ?? 0,
      isSystem: false,
    });
    return this.toPayload(row);
  }

  async update(
    key: EntityKey,
    input: TUpdateGarmentTypeData,
  ): Promise<IGarmentType> {
    const existing = await this.entity.require(key);
    const row = await this.entity.update(existing.id, {
      ...(input.name != null ? { name: input.name } : {}),
      ...(input.audience != null ? { audience: input.audience } : {}),
      ...(input.sortOrder != null ? { sortOrder: input.sortOrder } : {}),
    });
    return this.toPayload(row);
  }

  async remove(key: EntityKey): Promise<IMessageResponse> {
    const existing = await this.entity.require(key);
    const inUse = await this.entity
      .getRepository()
      .manager.count(MeasurementEntity, {
        where: { garmentTypeId: existing.id, deletedAt: IsNull() },
      });
    if (inUse > 0) {
      throw new ConflictException(
        "This garment is used on customers or orders. Rename it instead.",
      );
    }
    await this.entity.softDelete(existing.id);
    return { message: "Garment type deleted" };
  }

  findBySlug(
    slug: string,
    includeDeleted = false,
  ): Promise<GarmentTypeEntity | null> {
    const query = this.entity
      .getRepository()
      .createQueryBuilder("garmentType")
      .where("garmentType.slug = :slug", { slug });
    if (!includeDeleted) {
      query.andWhere("garmentType.deletedAt IS NULL");
    }
    return query.getOne();
  }

  async createSystem(type: TSystemGarmentTypeSeed): Promise<IGarmentType> {
    const row = await this.entity.create({
      slug: type.slug,
      name: type.name,
      audience: type.audience,
      sortOrder: type.sortOrder,
      isSystem: true,
    });
    return this.toPayload(row);
  }

  markAsSystem(key: EntityKey): Promise<GarmentTypeEntity> {
    return this.entity.update(key, { isSystem: true });
  }

  require(key: EntityKey): Promise<GarmentTypeEntity> {
    return this.entity.require(key);
  }

  toPayload(row: GarmentTypeEntity): IGarmentType {
    return {
      id: row.id,
      slug: row.slug,
      name: row.name,
      audience: row.audience,
      sortOrder: row.sortOrder,
      isSystem: row.isSystem,
      createdAt: toIso(row.createdAt),
      updatedAt: toIso(row.updatedAt),
    };
  }

  private async uniqueSlug(base: string): Promise<string> {
    const repo = this.entity.getRepository();
    let slug = base;
    let n = 2;
    while (n < 50) {
      const existing = await repo
        .createQueryBuilder("garmentType")
        .where("garmentType.slug = :slug", { slug })
        .getOne();
      if (!existing) return slug;
      slug = `${base}-${n}`;
      n += 1;
    }
    throw new ConflictException("Could not make a unique garment slug.");
  }
}

function toIso(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}
