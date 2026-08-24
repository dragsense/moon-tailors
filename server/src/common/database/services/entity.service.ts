import { Injectable, NotFoundException } from "@nestjs/common";
import { buildPaginatedResponse } from "@moon-tailors/contracts";
import type {
  DeepPartial,
  EntityManager,
  EntityTarget,
  ObjectLiteral,
  Repository,
} from "typeorm";
import { RequestContext } from "../../context";
import {
  buildEntityQuery,
  findOneEntity,
  paginateQuery,
  type EntityKey,
  type EntityQueryConfig,
  type ListQueryInput,
  type PaginatedRows,
} from "../../query";
import type {
  IBoundEntityService,
  ICreateEntityCallbacks,
  IDeleteEntityCallbacks,
  IEntityMutationOptions,
  IEntityService,
  IUpdateEntityCallbacks,
} from "../interfaces";
import { EntityRouterService } from "./entity-router.service";

/**
 * Shared entity mutations (CrudService-style callbacks + template routing).
 *
 * Bind once with `bind` in a feature service (returns a dedicated helper;
 * does not mutate this singleton).
 *
 * @example
 * private readonly entity = this.entityService.bind(TaskEntity, TASK_QUERY);
 * const page = await this.entity.list(query, { beforeQuery });
 * await this.entity.get(id);
 * await this.entity.create(data, { beforeCreate, afterCreate });
 */
@Injectable()
export class EntityService implements IEntityService {
  constructor(private readonly entityRouter: EntityRouterService) {}

  bind<T extends ObjectLiteral>(
    entity: EntityTarget<T>,
    config: EntityQueryConfig,
  ): IBoundEntityService<T> {
    return {
      getRepository: (tenantId) => this.getRepository(entity, tenantId),
      getManager: (tenantId) => this.getManager(entity, tenantId),
      list: (query, options) => this.list(entity, config, query, options),
      /** `get` — returns `null` when missing. */
      get: (key, options, manager) =>
        this.get(entity, config, key, options, manager),
      require: (key, options, manager) =>
        this.require(entity, config, key, options, manager),
      create: (data, callbacks) => this.create(entity, data, callbacks),
      update: (key, data, callbacks, options) =>
        this.update(entity, config, key, data, callbacks, options),
      softDelete: (key, callbacks, options) =>
        this.softDelete(entity, config, key, callbacks, options),
      hardDelete: (key, callbacks, options) =>
        this.hardDelete(entity, config, key, callbacks, options),
      softDeleteMany: (keys, options) =>
        this.softDeleteMany(entity, config, keys, options),
    };
  }

  getRepository<T extends ObjectLiteral>(
    entity: EntityTarget<T>,
    tenantId?: string,
  ): Repository<T> {
    return this.entityRouter.getRepository(entity, tenantId);
  }

  getManager(
    entity: EntityTarget<ObjectLiteral>,
    tenantId?: string,
  ): EntityManager {
    return this.entityRouter.getManager(entity, tenantId);
  }

  async list<T extends ObjectLiteral>(
    entity: EntityTarget<T>,
    config: EntityQueryConfig,
    query: ListQueryInput,
    options?: IEntityMutationOptions,
  ): Promise<PaginatedRows<T>> {
    const { queryConfig, queryOptions } = this.mergeQueryOptions(
      config,
      options,
    );
    const qb = await buildEntityQuery(
      this.getRepository(entity),
      queryConfig,
      {
        ...query,
        _relations: query._relations ?? options?._relations,
        _select: query._select ?? options?._select,
      },
      queryOptions,
    );
    if (queryConfig.skipPagination === true) {
      const data = await qb.getMany();
      return buildPaginatedResponse(data, data.length, 1, data.length || 1);
    }
    return paginateQuery(qb, query.page, query.limit);
  }

  async get<T extends ObjectLiteral>(
    entity: EntityTarget<T>,
    config: EntityQueryConfig,
    key: EntityKey,
    options?: IEntityMutationOptions,
    manager?: EntityManager,
  ): Promise<T | null> {
    const repo = manager?.getRepository(entity) ?? this.getRepository(entity);
    const { queryConfig, queryOptions } = this.mergeQueryOptions(
      config,
      options,
    );
    return findOneEntity(
      repo,
      queryConfig,
      key,
      {
        _relations: options?._relations,
        _select: options?._select,
      },
      queryOptions,
    );
  }

  async require<T extends ObjectLiteral>(
    entity: EntityTarget<T>,
    config: EntityQueryConfig,
    key: EntityKey,
    options?: IEntityMutationOptions,
    manager?: EntityManager,
  ): Promise<T> {
    const row = await this.get(entity, config, key, options, manager);
    if (!row) throw new NotFoundException("Entity not found");
    return row;
  }

  create<
    T extends ObjectLiteral,
    TData extends DeepPartial<T> = DeepPartial<T>,
  >(
    entity: EntityTarget<T>,
    data: TData,
    callbacks?: ICreateEntityCallbacks<T, TData>,
  ): Promise<T> {
    return this.getManager(entity).transaction(async (manager) => {
      const repo = manager.getRepository(entity);
      let processed = this.stampTenant(repo, { ...data }) as TData;

      if (callbacks?.beforeCreate) {
        processed = await callbacks.beforeCreate(processed, manager);
      }

      const saved = await manager.save(repo.create(processed));

      if (callbacks?.afterCreate) {
        await callbacks.afterCreate(saved, manager);
      }

      return saved;
    });
  }

  update<T extends ObjectLiteral, TData extends Partial<T> = Partial<T>>(
    entity: EntityTarget<T>,
    config: EntityQueryConfig,
    key: EntityKey,
    data: TData,
    callbacks?: IUpdateEntityCallbacks<T, TData>,
    options?: IEntityMutationOptions,
  ): Promise<T> {
    return this.getManager(entity).transaction(async (manager) => {
      const existingEntity = await this.require(
        entity,
        config,
        key,
        options,
        manager,
      );

      let processedData = { ...data };
      if (callbacks?.beforeUpdate) {
        processedData = await callbacks.beforeUpdate(
          processedData,
          existingEntity,
          manager,
        );
      }

      Object.assign(existingEntity, processedData);
      const saved = await manager.save(existingEntity);

      if (callbacks?.afterUpdate) {
        await callbacks.afterUpdate(saved, manager);
      }

      return saved;
    });
  }

  softDelete<T extends ObjectLiteral>(
    entity: EntityTarget<T>,
    config: EntityQueryConfig,
    key: EntityKey,
    callbacks?: IDeleteEntityCallbacks<T>,
    options?: IEntityMutationOptions,
  ): Promise<T> {
    return this.getManager(entity).transaction(async (manager) => {
      const existingEntity = await this.require(
        entity,
        config,
        key,
        options,
        manager,
      );

      if (callbacks?.beforeDelete) {
        await callbacks.beforeDelete(existingEntity, manager);
      }

      (existingEntity as { deletedAt?: Date | null }).deletedAt = new Date();
      (existingEntity as { deletedByUserId?: string | null }).deletedByUserId =
        RequestContext.get("userId") ?? null;
      const saved = await manager.save(existingEntity);

      if (callbacks?.afterDelete) {
        await callbacks.afterDelete(saved, manager);
      }

      return saved;
    });
  }

  hardDelete<T extends ObjectLiteral>(
    entity: EntityTarget<T>,
    config: EntityQueryConfig,
    key: EntityKey,
    callbacks?: IDeleteEntityCallbacks<T>,
    options?: IEntityMutationOptions,
  ): Promise<void> {
    return this.getManager(entity).transaction(async (manager) => {
      const existingEntity = await this.require(
        entity,
        config,
        key,
        options,
        manager,
      );

      if (callbacks?.beforeDelete) {
        await callbacks.beforeDelete(existingEntity, manager);
      }

      await manager.remove(existingEntity);

      if (callbacks?.afterDelete) {
        await callbacks.afterDelete(existingEntity, manager);
      }
    });
  }

  softDeleteMany<T extends ObjectLiteral>(
    entity: EntityTarget<T>,
    config: EntityQueryConfig,
    keys: EntityKey[],
    options?: IEntityMutationOptions,
  ): Promise<number> {
    return this.getManager(entity).transaction(async (manager) => {
      let count = 0;
      for (const key of keys) {
        const row = await this.get(entity, config, key, options, manager);
        if (!row) continue;
        (row as { deletedAt?: Date | null }).deletedAt = new Date();
        (row as { deletedByUserId?: string | null }).deletedByUserId =
          RequestContext.get("userId") ?? null;
        await manager.save(row);
        count += 1;
      }
      return count;
    });
  }

  /** Merge per-call options onto `EntityQueryConfig` (call wins). */
  private mergeQueryOptions(
    config: EntityQueryConfig,
    options?: IEntityMutationOptions,
  ): {
    queryConfig: EntityQueryConfig;
    queryOptions?: IEntityMutationOptions;
  } {
    const includeDeleted =
      options?.includeDeleted === true || config.includeDeleted === true;
    const deletedOnly =
      !includeDeleted &&
      (options?.deletedOnly === true || config.deletedOnly === true);
    const skipPagination =
      options?.skipPagination === true || config.skipPagination === true;

    const queryConfig: EntityQueryConfig = {
      ...config,
      includeDeleted,
      deletedOnly,
      skipPagination,
      // Soft-delete scope is applied in applyQueryOptions via include/deletedOnly.
      excludeDeleted:
        includeDeleted || deletedOnly ? false : config.excludeDeleted,
    };

    return { queryConfig, queryOptions: options };
  }

  private stampTenant<T extends ObjectLiteral>(
    repo: Repository<T>,
    data: DeepPartial<T>,
  ): DeepPartial<T> {
    const hasTenant = repo.metadata.columns.some(
      (column) => column.propertyName === "tenantId",
    );
    if (!hasTenant) return data;
    const row = data as { tenantId?: string | null };
    if (row.tenantId != null) return data;
    return {
      ...data,
      tenantId: RequestContext.get("tenantId") ?? null,
    } as DeepPartial<T>;
  }
}
