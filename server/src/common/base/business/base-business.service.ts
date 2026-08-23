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
  type IPaginatedResponse,
  type TBusinessListQuery,
  type TCreateBusinessData,
} from "@template/contracts";
import {
  EntityService,
  type IBoundEntityService,
} from "../../database";
import {
  applyQueryOptions,
  paginateQuery,
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
  searchable: ["name", "subdomain"],
  sortable: ["createdAt", "updatedAt", "name", "subdomain"],
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
    const subdomain = input.subdomain?.toLowerCase().trim() || null;
    if (subdomain) {
      const taken = await this.entity.getRepository().findOne({
        where: { subdomain, deletedAt: IsNull() },
      });
      if (taken) {
        throw new ConflictException(`Subdomain "${subdomain}" is taken`);
      }
    }

    if (options.isPlatform) {
      const existingPlatform = await this.findPlatform();
      if (existingPlatform) {
        throw new ConflictException("Platform business already exists");
      }
    }

    return this.entity.create({
      name: input.name.trim(),
      subdomain,
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

  findBySubdomain(subdomain: string): Promise<BusinessEntity | null> {
    return this.entity.getRepository().findOne({
      where: {
        subdomain: subdomain.toLowerCase(),
        isActive: true,
        deletedAt: IsNull(),
      },
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

  /**
   * Unscoped catalog list — `tenantId` on this entity is not a parent FK
   * (see class note). Uses BUSINESS_QUERY + pagination (`passwordHash` restricted).
   */
  async list(
    query: TBusinessListQuery,
  ): Promise<IPaginatedResponse<BusinessEntity>> {
    const qb = this.entity
      .getRepository()
      .createQueryBuilder(BUSINESS_QUERY.alias);
    applyQueryOptions(qb, BUSINESS_QUERY, query, this.entity.getRepository());
    return paginateQuery(qb, query.page, query.limit);
  }

  async setPaymentProcessor(
    id: string,
    paymentProcessorId: string | null,
  ): Promise<BusinessEntity> {
    // Unscoped — Business.tenantId is not a parent FK (see class note).
    const row = await this.get(id);
    row.paymentProcessorId = paymentProcessorId;
    return this.entity.getRepository().save(row);
  }

  async setAiProcessor(
    id: string,
    aiProcessorId: string | null,
  ): Promise<BusinessEntity> {
    const row = await this.get(id);
    row.aiProcessorId = aiProcessorId;
    return this.entity.getRepository().save(row);
  }
}
