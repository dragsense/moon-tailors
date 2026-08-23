import {
  ConflictException,
  Injectable,
} from "@nestjs/common";
import {
  EUserLevel,
  type IPaginatedResponse,
  type TSignupData,
  type TUserListQuery,
} from "@template/contracts";
import * as bcrypt from "bcrypt";
import {
  EntityService,
  type IBoundEntityService,
  type ICreateEntityCallbacks,
  type IEntityMutationOptions,
  type IUpdateEntityCallbacks,
} from "../../database";
import type {
  AccessScope,
  EntityKey,
  EntityQueryConfig,
} from "../../query";
import { UserEntity } from "./entities";

export const USER_QUERY: EntityQueryConfig = {
  alias: "user",
  restrictedFields: ["passwordHash"],
  searchable: ["firstName", "lastName", "email"],
  sortable: ["firstName", "lastName", "email", "createdAt", "updatedAt"],
  defaultSort: { field: "firstName", order: "ASC" },
};

@Injectable()
export class BaseUsersService {
  private readonly entity: IBoundEntityService<UserEntity>;

  constructor(private readonly entityService: EntityService) {
    this.entity = this.entityService.bind(UserEntity, USER_QUERY);
  }

  /**
   * Auth lookup — `passwordHash` is `select: false` + restricted from client
   * `_select`; load it only here via `addSelect`.
   */
  findByEmail(email: string): Promise<UserEntity | null> {
    return this.entity
      .getRepository()
      .createQueryBuilder("user")
      .addSelect("user.passwordHash")
      .where("user.email = :email", {
        email: email.toLowerCase().trim(),
      })
      .andWhere("user.deletedAt IS NULL")
      .getOne();
  }

  findById(id: string): Promise<UserEntity | null> {
    return this.entity.get(id, { access: [] });
  }

  requireById(id: EntityKey): Promise<UserEntity> {
    return this.entity.require(id, { access: [] });
  }

  /**
   * List users (any real `_select` / `_relations`; `passwordHash` restricted).
   * Not owner-scoped by default (`access: []`); pass `access` to tighten.
   */
  list(
    query: TUserListQuery,
    access?: AccessScope | AccessScope[],
  ): Promise<IPaginatedResponse<UserEntity>> {
    return this.entity.list(query, { access: access ?? [] });
  }

  /**
   * `get` / `require` — id or column map + optional `_select` / `_relations`.
   */
  get(key: EntityKey, options?: IEntityMutationOptions): Promise<UserEntity> {
    return this.entity.require(key, { access: [], ...options });
  }

  async createFromSignup(
    input: TSignupData,
    callbacks?: ICreateEntityCallbacks<UserEntity>,
  ): Promise<UserEntity> {
    const passwordHash = await bcrypt.hash(input.password, 10);
    return this.entity.create(
      {
        email: input.email.toLowerCase().trim(),
        firstName: input.firstName,
        lastName: input.lastName,
        passwordHash,
        level: EUserLevel.SUPER_ADMIN,
        emailVerifiedAt: null,
      },
      this.mergeCreateCallbacks(async (data) => {
        const existing = await this.findByEmail(String(data.email));
        if (existing) {
          throw new ConflictException("Email already registered");
        }
        return data;
      }, callbacks),
    );
  }

  /**
   * Admin-created account (Users module). Caller supplies a plaintext password
   * (often auto-generated) which is hashed before persist.
   */
  async createByAdmin(
    input: {
      email: string;
      password: string;
      firstName: string;
      lastName: string;
      level?: EUserLevel;
    },
    callbacks?: ICreateEntityCallbacks<UserEntity>,
  ): Promise<UserEntity> {
    const level = input.level ?? EUserLevel.MEMBER;
    if (level === EUserLevel.PLATFORM_OWNER) {
      throw new ConflictException("Cannot create user with this level");
    }

    const passwordHash = await bcrypt.hash(input.password, 10);
    return this.entity.create(
      {
        email: input.email.toLowerCase().trim(),
        firstName: input.firstName.trim(),
        lastName: input.lastName.trim(),
        passwordHash,
        level,
        isActive: true,
        emailVerifiedAt: null,
      },
      this.mergeCreateCallbacks(async (data) => {
        const existing = await this.findByEmail(String(data.email));
        if (existing) {
          throw new ConflictException("Email already exists");
        }
        return data;
      }, callbacks),
    );
  }

  /**
   * Update user fields (email / name). Use `beforeUpdate` / `afterUpdate` for
   * permission sync and other side effects.
   */
  async update(
    id: EntityKey,
    input: { firstName?: string; lastName?: string; email?: string },
    callbacks?: IUpdateEntityCallbacks<UserEntity>,
  ): Promise<UserEntity> {
    const patch: Partial<UserEntity> = {};
    if (input.firstName !== undefined) patch.firstName = input.firstName.trim();
    if (input.lastName !== undefined) patch.lastName = input.lastName.trim();
    if (input.email !== undefined) {
      patch.email = input.email.toLowerCase().trim();
    }

    return this.entity.update(
      id,
      patch,
      this.mergeUpdateCallbacks(async (data, existing) => {
        if (
          data.email &&
          data.email.toLowerCase() !== existing.email.toLowerCase()
        ) {
          const taken = await this.findByEmail(data.email);
          if (taken && taken.id !== existing.id) {
            throw new ConflictException("Email already exists");
          }
        }
        return data;
      }, callbacks),
      { access: [] },
    );
  }

  async softDelete(id: EntityKey): Promise<void> {
    await this.entity.softDelete(id, undefined, { access: [] });
  }

  findByLevel(level: EUserLevel): Promise<UserEntity | null> {
    return this.entity.get({ level }, { access: [] });
  }

  /**
   * Idempotent bootstrap account — used by PlatformOwnerSeed in UsersModule.
   * PLATFORM_OWNER cannot be created via public signup / API.
   */
  async createPlatformOwner(
    input: {
      email: string;
      password: string;
      firstName: string;
      lastName: string;
    },
    callbacks?: ICreateEntityCallbacks<UserEntity>,
  ): Promise<UserEntity> {
    const existingLevel = await this.findByLevel(EUserLevel.PLATFORM_OWNER);
    if (existingLevel) return existingLevel;

    const passwordHash = await bcrypt.hash(input.password, 10);
    return this.entity.create(
      {
        email: input.email.toLowerCase().trim(),
        firstName: input.firstName,
        lastName: input.lastName,
        passwordHash,
        level: EUserLevel.PLATFORM_OWNER,
        isActive: true,
        emailVerifiedAt: new Date(),
      },
      this.mergeCreateCallbacks(async (data) => {
        const existingEmail = await this.findByEmail(String(data.email));
        if (existingEmail) {
          throw new ConflictException(
            "Platform owner email already registered at a different level",
          );
        }
        return data;
      }, callbacks),
    );
  }

  async verifyPassword(user: UserEntity, password: string): Promise<boolean> {
    return bcrypt.compare(password, user.passwordHash);
  }

  async markEmailVerified(userId: string): Promise<UserEntity> {
    const user = await this.entity.require(userId, { access: [] });
    if (!user.emailVerifiedAt) {
      return this.entity.update(userId, { emailVerifiedAt: new Date() });
    }
    return user;
  }

  async updatePassword(userId: string, password: string): Promise<UserEntity> {
    await this.entity.require(userId, { access: [] });
    return this.entity.update(userId, {
      passwordHash: await bcrypt.hash(password, 10),
    });
  }

  private mergeCreateCallbacks(
    beforeCreate: NonNullable<
      ICreateEntityCallbacks<UserEntity>["beforeCreate"]
    >,
    callbacks?: ICreateEntityCallbacks<UserEntity>,
  ): ICreateEntityCallbacks<UserEntity> {
    return {
      beforeCreate: async (data, manager) => {
        let next = await beforeCreate(data, manager);
        if (callbacks?.beforeCreate) {
          next = await callbacks.beforeCreate(next, manager);
        }
        return next;
      },
      afterCreate: callbacks?.afterCreate,
    };
  }

  private mergeUpdateCallbacks(
    beforeUpdate: NonNullable<
      IUpdateEntityCallbacks<UserEntity>["beforeUpdate"]
    >,
    callbacks?: IUpdateEntityCallbacks<UserEntity>,
  ): IUpdateEntityCallbacks<UserEntity> {
    return {
      beforeUpdate: async (data, existing, manager) => {
        let next = await beforeUpdate(data, existing, manager);
        if (callbacks?.beforeUpdate) {
          next = await callbacks.beforeUpdate(next, existing, manager);
        }
        return next;
      },
      afterUpdate: callbacks?.afterUpdate,
    };
  }
}
