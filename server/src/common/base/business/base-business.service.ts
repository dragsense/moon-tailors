import {
  Injectable,
  NotFoundException,
  ConflictException,
} from "@nestjs/common";
import { randomUUID } from "node:crypto";
import { IsNull } from "typeorm";
import {
  businessListQuerySchema,
  filtersFromListSchema,
  type TCreateBusinessData,
} from "@moon-tailors/contracts";
import {
  EntityService,
  type IBoundEntityService,
} from "../../database";
import {
  type EntityQueryConfig,
} from "../../query";
import { BusinessEntity } from "./entities";

export type CreateBusinessOptions = {
  ownerUserId?: string;
  isPlatform?: boolean;
};

export const BUSINESS_QUERY: EntityQueryConfig = {
  alias: "business",
  restrictedFields: ["passwordHash"],
  searchable: ["name"],
  sortable: ["createdAt", "updatedAt", "name"],
  defaultSort: { field: "createdAt", order: "DESC" },
  filters: filtersFromListSchema(businessListQuerySchema),
};

/**
 * Business rows use `tenantId` as their own isolation key (DB routing), not a
 * parent-tenant FK. EntityService.list/get auto-scope by that column would
 * hide other businesses — catalog lookups stay on the repository.
 */
@Injectable()
export class BaseBusinessService {
  private readonly entity: IBoundEntityService<BusinessEntity>;

  constructor(private readonly entityService: EntityService) {
    this.entity = this.entityService.bind(BusinessEntity, BUSINESS_QUERY);
  }

  async create(
    input: TCreateBusinessData,
    options: CreateBusinessOptions = {},
  ): Promise<BusinessEntity> {

    if (options.isPlatform) {
      const existingPlatform = await this.findPlatform();
      if (existingPlatform) {
        throw new ConflictException("Platform business already exists");
      }
    }

    return this.entity.create({
      name: input.name.trim(),
      tenantId: randomUUID(),
      ownerUserId: options.ownerUserId ?? null,
      isPlatform: options.isPlatform ?? false,
      isActive: true,
    });
  }



  findById(id: string): Promise<BusinessEntity | null> {
    return this.entity.getRepository().findOne({
      where: { id, deletedAt: IsNull() },
    });
  }

  findByTenantId(tenantId: string): Promise<BusinessEntity | null> {
    return this.entity.getRepository().findOne({
      where: { tenantId, isActive: true, deletedAt: IsNull() },
    });
  }



  findPlatform(): Promise<BusinessEntity | null> {
    return this.entity.getRepository().findOne({
      where: { isPlatform: true, isActive: true, deletedAt: IsNull() },
    });
  }

  findByOwnerUserId(ownerUserId: string): Promise<BusinessEntity | null> {
    return this.entity.getRepository().findOne({
      where: { ownerUserId, deletedAt: IsNull() },
      order: { createdAt: "ASC" },
    });
  }

  async get(id: string): Promise<BusinessEntity> {
    const row = await this.findById(id);
    if (!row) throw new NotFoundException("Business not found");
    return row;
  }



}
