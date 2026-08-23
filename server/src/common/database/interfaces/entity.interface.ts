import type {
  DeepPartial,
  EntityManager,
  EntityTarget,
  ObjectLiteral,
  Repository,
} from "typeorm";
import type {
  BuildEntityQueryOptions,
  EntityKey,
  EntityQueryConfig,
  ListQueryInput,
  PaginatedRows,
} from "../../query";

/**
 * Per-call options for list / getSingle-style find / mutations.
 * Overrides `EntityQueryConfig`. Mirrors `getSingle(key, queryDto, …)`.
 */
export interface IEntityMutationOptions extends BuildEntityQueryOptions {
  /** Relation paths for this call (`queryDto._relations`); validated against metadata. */
  _relations?: string[];
  /** Select paths for this call (`queryDto._select`); secrets blocked via `restrictedFields`. */
  _select?: string[];
  /** Include soft-deleted rows (active + deleted). Overrides config. */
  includeDeleted?: boolean;
  /** Only soft-deleted rows (`deletedAt IS NOT NULL`). Ignored when `includeDeleted`. */
  deletedOnly?: boolean;
  /** Skip skip/take — return all matches (still `IPaginatedResponse`). Overrides config. */
  skipPagination?: boolean;
}

/** create hooks — same TX via `manager`. */
export interface ICreateEntityCallbacks<
  T extends ObjectLiteral,
  TData = DeepPartial<T>,
> {
  beforeCreate?: (
    processedData: TData,
    manager: EntityManager,
  ) => TData | Promise<TData>;
  afterCreate?: (result: T, manager: EntityManager) => void | Promise<void>;
}

/** update hooks — same TX via `manager`. */
export interface IUpdateEntityCallbacks<
  T extends ObjectLiteral,
  TData = Partial<T>,
> {
  beforeUpdate?: (
    processedData: TData,
    existingEntity: T,
    manager: EntityManager,
  ) => TData | Promise<TData>;
  afterUpdate?: (
    updatedEntity: T,
    manager: EntityManager,
  ) => void | Promise<void>;
}

/** delete hooks — same TX via `manager`. */
export interface IDeleteEntityCallbacks<T extends ObjectLiteral> {
  beforeDelete?: (entity: T, manager: EntityManager) => void | Promise<void>;
  afterDelete?: (entity: T, manager: EntityManager) => void | Promise<void>;
}

/**
 * Entity-bound surface from `EntityService.bind(...)`.
 * Query plumbing lives in `common/query`; this wires list/get/mutations.
 */
export interface IBoundEntityService<T extends ObjectLiteral> {
  getRepository(tenantId?: string): Repository<T>;
  getManager(tenantId?: string): EntityManager;

  list(
    query: ListQueryInput,
    options?: IEntityMutationOptions,
  ): Promise<PaginatedRows<T>>;

  /**
   * `getSingle` — id or column map + `_select`/`_relations`.
   * Returns `null` when missing.
   */
  get(
    key: EntityKey,
    options?: IEntityMutationOptions,
    manager?: EntityManager,
  ): Promise<T | null>;

  /** Like `get`, but throws `NotFoundException` when missing. */
  require(
    key: EntityKey,
    options?: IEntityMutationOptions,
    manager?: EntityManager,
  ): Promise<T>;

  create<TData extends DeepPartial<T> = DeepPartial<T>>(
    data: TData,
    callbacks?: ICreateEntityCallbacks<T, TData>,
  ): Promise<T>;

  update<TData extends Partial<T> = Partial<T>>(
    key: EntityKey,
    data: TData,
    callbacks?: IUpdateEntityCallbacks<T, TData>,
    options?: IEntityMutationOptions,
  ): Promise<T>;

  softDelete(
    key: EntityKey,
    callbacks?: IDeleteEntityCallbacks<T>,
    options?: IEntityMutationOptions,
  ): Promise<T>;

  hardDelete(
    key: EntityKey,
    callbacks?: IDeleteEntityCallbacks<T>,
    options?: IEntityMutationOptions,
  ): Promise<void>;

  softDeleteMany(
    keys: EntityKey[],
    options?: IEntityMutationOptions,
  ): Promise<number>;
}

/**
 * Shared entity mutation surface (`ICrudService` shape, template routing).
 * Prefer `bind` in feature services so callers omit entity/config each call.
 */
export interface IEntityService {
  bind<T extends ObjectLiteral>(
    entity: EntityTarget<T>,
    config: EntityQueryConfig,
  ): IBoundEntityService<T>;

  getRepository<T extends ObjectLiteral>(
    entity: EntityTarget<T>,
    tenantId?: string,
  ): Repository<T>;

  getManager(
    entity: EntityTarget<ObjectLiteral>,
    tenantId?: string,
  ): EntityManager;

  list<T extends ObjectLiteral>(
    entity: EntityTarget<T>,
    config: EntityQueryConfig,
    query: ListQueryInput,
    options?: IEntityMutationOptions,
  ): Promise<PaginatedRows<T>>;

  get<T extends ObjectLiteral>(
    entity: EntityTarget<T>,
    config: EntityQueryConfig,
    key: EntityKey,
    options?: IEntityMutationOptions,
    manager?: EntityManager,
  ): Promise<T | null>;

  require<T extends ObjectLiteral>(
    entity: EntityTarget<T>,
    config: EntityQueryConfig,
    key: EntityKey,
    options?: IEntityMutationOptions,
    manager?: EntityManager,
  ): Promise<T>;

  create<
    T extends ObjectLiteral,
    TData extends DeepPartial<T> = DeepPartial<T>,
  >(
    entity: EntityTarget<T>,
    data: TData,
    callbacks?: ICreateEntityCallbacks<T, TData>,
  ): Promise<T>;

  update<T extends ObjectLiteral, TData extends Partial<T> = Partial<T>>(
    entity: EntityTarget<T>,
    config: EntityQueryConfig,
    key: EntityKey,
    data: TData,
    callbacks?: IUpdateEntityCallbacks<T, TData>,
    options?: IEntityMutationOptions,
  ): Promise<T>;

  softDelete<T extends ObjectLiteral>(
    entity: EntityTarget<T>,
    config: EntityQueryConfig,
    key: EntityKey,
    callbacks?: IDeleteEntityCallbacks<T>,
    options?: IEntityMutationOptions,
  ): Promise<T>;

  hardDelete<T extends ObjectLiteral>(
    entity: EntityTarget<T>,
    config: EntityQueryConfig,
    key: EntityKey,
    callbacks?: IDeleteEntityCallbacks<T>,
    options?: IEntityMutationOptions,
  ): Promise<void>;

  softDeleteMany<T extends ObjectLiteral>(
    entity: EntityTarget<T>,
    config: EntityQueryConfig,
    keys: EntityKey[],
    options?: IEntityMutationOptions,
  ): Promise<number>;
}
