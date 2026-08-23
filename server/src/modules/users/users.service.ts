import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import type {
  IMessageResponse,
  IPaginatedResponse,
  TCreateUserData,
  TSignupData,
  TUpdateUserData,
  TUserListQuery,
  TUserResponse,
} from "@template/contracts";
import {
  DEFAULT_USER_PREFERENCES,
  EResource,
  EUserLevel,
} from "@template/contracts";
import {
  BaseSettingsService,
  BaseUsersService,
  PermissionsService,
  UserEntity,
} from "../../common/base";
import { ActivityLogRegistry } from "../../common/activity-logs";
import { DomainEventRegistry, EventService } from "../../common/events";
import type { EntityKey } from "../../common/query";
import { UserEmailService } from "./services/user-email.service";
import { defaultPermissionsForLevel } from "./user-level.permissions";
import {
  generateStrongPassword,
  splitDisplayName,
} from "./utils/password.util";

@Injectable()
export class UsersService implements OnModuleInit {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    private readonly permissions: PermissionsService,
    private readonly settings: BaseSettingsService,
    private readonly baseUsers: BaseUsersService,
    private readonly events: EventService,
    private readonly userEmail: UserEmailService,
  ) {}

  async onModuleInit() {
    await this.permissions.ensureResource(EResource.USERS);
    ActivityLogRegistry.register({
      module: "users",
      endpoints: ["/api/users"],
      methods: ["POST", "PUT", "PATCH", "DELETE"],
    });
    DomainEventRegistry.register({
      module: "users",
      events: { endpoint: "/api/users", tableName: "base_users" },
    });
    this.logger.debug("Users module ready");
  }

  /** Public signup — permissions + default settings in `afterCreate`. */
  signup(input: TSignupData): Promise<UserEntity> {
    return this.baseUsers.createFromSignup(input, {
      afterCreate: (user) => this.afterCreateUser(user),
    });
  }

  /**
   * Admin create — auto-generates a temp password, persists the user,
   * returns plaintext password once for the credentials modal.
   * Welcome email is triggered by DomainEventInterceptor → user.crud.create.
   */
  async create(input: TCreateUserData): Promise<TUserResponse> {
    const tempPassword = generateStrongPassword(12);
    const { firstName, lastName } = splitDisplayName(input.name);
    const level = EUserLevel.MEMBER;

    const entity = await this.baseUsers.createByAdmin(
      {
        email: input.email,
        password: tempPassword,
        firstName,
        lastName,
        level,
      },
      {
        afterCreate: (user) => this.afterCreateUser(user),
      },
    );

    if (!this.events.isGloballyEnabled()) {
      void this.userEmail
        .sendWelcomeEmail({ user: entity, tempPassword })
        .catch((error) => {
          const message =
            error instanceof Error ? error.message : String(error);
          this.logger.error(
            `Welcome email fallback failed for ${entity.email}: ${message}`,
          );
        });
    }

    return {
      message: "User created successfully.",
      user: Object.assign(entity, { password: tempPassword }) as UserEntity & {
        password: string;
      },
    } as unknown as TUserResponse;
  }

  list(query: TUserListQuery): Promise<IPaginatedResponse<UserEntity>> {
    return this.baseUsers.list(query);
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

  markEmailVerified(userId: string): Promise<UserEntity> {
    return this.baseUsers.markEmailVerified(userId);
  }

  updatePassword(userId: string, password: string): Promise<UserEntity> {
    return this.baseUsers.updatePassword(userId, password);
  }

  async update(
    key: EntityKey,
    input: TUpdateUserData,
  ): Promise<IMessageResponse> {
    const existing = await this.baseUsers.get(key);
    const nameParts = input.name
      ? splitDisplayName(input.name)
      : {
          firstName: existing.firstName,
          lastName: existing.lastName,
        };

    await this.baseUsers.update(key, {
      firstName: nameParts.firstName,
      lastName: nameParts.lastName,
      email: input.email,
    });

    return { message: "User updated" };
  }

  async remove(key: EntityKey): Promise<IMessageResponse> {
    await this.baseUsers.softDelete(key);
    return { message: "User deleted" };
  }

  /** Platform-owner seed — same afterCreate bootstrap as signup/admin create. */
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
