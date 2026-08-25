import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import {
  EGender,
  EUserLevel,
  type TChangePasswordData,
  type TUpdateMeData,
} from "@moon-tailors/contracts";
import * as bcrypt from "bcrypt";
import {
  EntityService,
  type IBoundEntityService,
  type ICreateEntityCallbacks,
  type IEntityMutationOptions,
  type IUpdateEntityCallbacks,
} from "../../database";
import type {
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

  /**
   * Session lookup for AuthGuard. Must not apply tenant scope — login uses
   * the same unscoped query, and platform owner rows may have `tenantId` null.
   */
  findByIdForAuth(id: string): Promise<UserEntity | null> {
    return this.entity
      .getRepository()
      .createQueryBuilder("user")
      .where("user.id = :id", { id })
      .andWhere("user.deletedAt IS NULL")
      .getOne();
  }

  requireById(id: EntityKey): Promise<UserEntity> {
    return this.entity.require(id, { access: [] });
  }



  /**
   * `get` / `require` — id or column map + optional `_select` / `_relations`.
   */
  get(key: EntityKey, options?: IEntityMutationOptions): Promise<UserEntity> {
    return this.entity.require(key, { access: [], ...options });
  }


  findByLevel(level: EUserLevel): Promise<UserEntity | null> {
    return this.entity.get({ level }, { access: [] });
  }

  /**
   * Idempotent bootstrap account — used by PlatformOwnerSeed in UsersModule.
   * This is the only account bootstrap path (no public signup).
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

  async updatePlatformOwner(id: string, input: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }): Promise<UserEntity> {
    const passwordHash = await bcrypt.hash(input.password, 10);
    const user = await this.entity.update(id, {
      ...input,
      passwordHash,
    }, this.mergeUpdateCallbacks(async (data, existing, manager) => {
      if (data.email !== existing.email) {
        const existingEmail = await this.findByEmail(String(data.email));
        if (existingEmail) {
          throw new ConflictException("Email already registered");
        }
      }
      return data;
    }));
    return user;
  }

  async verifyPassword(user: UserEntity, password: string): Promise<boolean> {
    return bcrypt.compare(password, user.passwordHash);
  }

  findByIdWithPassword(id: string): Promise<UserEntity | null> {
    return this.entity
      .getRepository()
      .createQueryBuilder("user")
      .addSelect("user.passwordHash")
      .where("user.id = :id", { id })
      .andWhere("user.deletedAt IS NULL")
      .getOne();
  }

  async updateMe(id: string, input: TUpdateMeData): Promise<UserEntity> {
    const email = input.email.toLowerCase().trim();
    return this.entity.update(
      id,
      {
        firstName: input.firstName.trim(),
        lastName: input.lastName.trim(),
        email,
        age: input.age ?? null,
        gender: (input.gender as EGender | null) ?? null,
      },
      this.mergeUpdateCallbacks(async (data, existing) => {
        if (data.email && data.email !== existing.email) {
          const taken = await this.findByEmail(String(data.email));
          if (taken && taken.id !== existing.id) {
            throw new ConflictException("Email already registered");
          }
        }
        return data;
      }),
    );
  }

  async changePassword(
    id: string,
    input: TChangePasswordData,
  ): Promise<void> {
    if (input.newPassword !== input.confirmPassword) {
      throw new BadRequestException("New password and confirmation do not match");
    }
    if (input.newPassword === input.currentPassword) {
      throw new BadRequestException(
        "New password must be different from the current password",
      );
    }

    const user = await this.findByIdWithPassword(id);
    if (!user) throw new NotFoundException("User not found");

    const matches = await bcrypt.compare(
      input.currentPassword,
      user.passwordHash,
    );
    if (!matches) {
      throw new BadRequestException("Current password is incorrect");
    }

    const passwordHash = await bcrypt.hash(input.newPassword, 10);
    await this.entity.update(id, { passwordHash });
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
