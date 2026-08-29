import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import type { EntityManager } from "typeorm";

import {
  DEFAULT_USER_PREFERENCES,
  EResource,
  EUserLevel,
  type IMeUser,
  type IMessageResponse,
  type TChangePasswordData,
  type TUpdateMeData,
} from "@moon-tailors/contracts";
import {
  BaseSettingsService,
  BaseUsersService,
  PermissionsService,
  UserEntity,
} from "../../common/base";
import { ActivityLogRegistry } from "../../common/activity-logs";
import { DomainEventRegistry } from "../../common/events";
import type { EntityKey } from "../../common/query";
import { defaultPermissionsForLevel } from "./user-level.permissions";

@Injectable()
export class UsersService implements OnModuleInit {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    private readonly permissions: PermissionsService,
    private readonly settings: BaseSettingsService,
    private readonly baseUsers: BaseUsersService,
  ) {}

  async onModuleInit() {
    await this.permissions.ensureResource(EResource.USERS);
    ActivityLogRegistry.register({
      module: "users",
      endpoints: ["/api/users"],
      methods: ["PUT", "PATCH", "DELETE"],
    });
    DomainEventRegistry.register({
      module: "users",
      events: { endpoint: "/api/users", tableName: "base_users" },
    });
    this.logger.debug("Users module ready");
  }


  get(key: EntityKey): Promise<UserEntity> {
    return this.baseUsers.get(key);
  }

  async find(id: string): Promise<UserEntity | undefined> {
    const user = await this.baseUsers.findById(id);
    return user ?? undefined;
  }

  findByEmail(email: string): Promise<UserEntity | null> {
    return this.baseUsers.findByEmail(email);
  }

  findById(id: string): Promise<UserEntity | null> {
    return this.baseUsers.findById(id);
  }

  findByLevel(level: EUserLevel): Promise<UserEntity | null> {
    return this.baseUsers.findByLevel(level);
  }

  verifyPassword(user: UserEntity, password: string): Promise<boolean> {
    return this.baseUsers.verifyPassword(user, password);
  }

  async getMe(user: UserEntity): Promise<IMeUser> {
    const fresh = (await this.baseUsers.findById(user.id)) ?? user;
    return this.toMeUser(fresh);
  }

  async updateMe(user: UserEntity, input: TUpdateMeData): Promise<IMeUser> {
    const updated = await this.baseUsers.updateMe(user.id, input);
    return this.toMeUser(updated);
  }

  async changePassword(
    user: UserEntity,
    input: TChangePasswordData,
  ): Promise<IMessageResponse> {
    await this.baseUsers.changePassword(user.id, input);
    return { message: "Password updated" };
  }

  /** Platform-owner seed — permissions + default preference settings. */
  async createPlatformOwner(input: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }): Promise<IMessageResponse> {
    const user = await this.baseUsers.createPlatformOwner(input, {
      afterCreate: (user, manager) => this.afterCreateUser(user, manager),
    });

    this.logger.log(`Platform owner created: ${user.email}`);

    return { message: `Platform owner created: ${user.email}` };
  }

  attachToTenant(id: string, tenantId: string): Promise<UserEntity | null> {
    return this.baseUsers.attachToTenant(id, tenantId);
  }



  /** afterCreate: level permissions + default preference settings (same TX as user insert). */
  private async afterCreateUser(
    user: UserEntity,
    manager: EntityManager,
  ): Promise<void> {
    await this.permissions.assignToUser(
      user.id,
      defaultPermissionsForLevel(user.level),
      manager,
    );
    await this.settings.saveSettings(user.id, {
      ...DEFAULT_USER_PREFERENCES,
    });
  }

  private toMeUser(user: UserEntity): IMeUser {
    user.hydrateDisplayName();
    return {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      name: user.name,
      email: user.email,
      age: user.age ?? null,
      gender: user.gender ?? null,
      level: user.level,
      createdAt: toIso(user.createdAt),
      updatedAt: toIso(user.updatedAt),
    };
  }
}

function toIso(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : String(value);
}
