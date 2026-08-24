import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import type {
  IMessageResponse,
  IPaginatedResponse,
  TUpdateUserData,
  TUserListQuery,
} from "@moon-tailors/contracts";
import {
  DEFAULT_USER_PREFERENCES,
  EResource,
  EUserLevel,
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



  /** Platform-owner seed — permissions + default preference settings. */
  createPlatformOwner(input: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }): Promise<UserEntity> {
    return this.baseUsers.createPlatformOwner(input, {
      afterCreate: (user) => this.afterCreateUser(user),
    });
  }

  /** Update platform owner user */
  async updatePlatformOwner(id: string, input: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }): Promise<UserEntity> {
    const user = await this.baseUsers.updatePlatformOwner(id, input);
    await this.permissions.assignToUser(
      user.id,
      defaultPermissionsForLevel(user.level),
    );
    return user;
  }

  /** afterCreate: level permissions + default preference settings. */
  private async afterCreateUser(user: UserEntity): Promise<void> {
    await this.permissions.assignToUser(
      user.id,
      defaultPermissionsForLevel(user.level),
    );
    await this.settings.saveSettings(user.id, {
      ...DEFAULT_USER_PREFERENCES,
    });
  }
}
