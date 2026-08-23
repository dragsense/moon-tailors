import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { EUserLevel } from "@template/contracts";
import { PermissionsService } from "../../../common/base";
import type { PlatformOwnerConfig } from "../../../config";
import { UsersService } from "../users.service";

/**
 * Seeds PLATFORM_OWNER once from PLATFORM_OWNER_* env.
 * Account bootstrap (permissions + settings) runs via UsersService.afterCreate.
 */
@Injectable()
export class PlatformOwnerSeed implements OnModuleInit {
  private readonly logger = new Logger(PlatformOwnerSeed.name);

  constructor(
    private readonly users: UsersService,
    private readonly permissions: PermissionsService,
    private readonly config: ConfigService,
  ) {}

  async onModuleInit() {
    await this.run();
  }

  async run(): Promise<void> {
    const existing = await this.users.findByLevel(EUserLevel.PLATFORM_OWNER);
    if (existing) {
      this.logger.log(
        `Platform owner already exists: ${existing.email}, skipping seed`,
      );
      return;
    }

    const cfg = this.config.getOrThrow<PlatformOwnerConfig>("platformOwner");
    this.logger.log(`Creating platform owner user: ${cfg.email}`);

    await this.permissions.ensureAllResources();

    const user = await this.users.createPlatformOwner({
      email: cfg.email,
      password: cfg.password,
      firstName: cfg.firstName || "Platform Owner",
      lastName: cfg.lastName || "User",
    });

    this.logger.log(`Platform owner seeded: ${user.email} (${user.id})`);
  }
}
