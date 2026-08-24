import {
  ConflictException,
  Injectable,
} from "@nestjs/common";
import {
  EUserLevel,
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
