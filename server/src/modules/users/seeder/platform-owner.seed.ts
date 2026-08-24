import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { EUserLevel } from "@moon-tailors/contracts";
import { PermissionsService } from "../../../common/base";
import type { PlatformOwnerConfig } from "../../../config";
import { defaultPermissionsForLevel } from "../user-level.permissions";
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

    const cfg = this.config.getOrThrow<PlatformOwnerConfig>("platformOwner");
    this.logger.log(`Creating platform owner user: ${cfg.email}`);

    const existing = await this.users.findByLevel(EUserLevel.PLATFORM_OWNER);
    
    await this.permissions.ensureAllResources();

    
    if (existing) {
      await this.permissions.assignToUser(
        existing.id,
        defaultPermissionsForLevel(EUserLevel.PLATFORM_OWNER),
      );

      this.logger.log(
        `Platform owner already exists: ${existing.email}, permissions refreshed`,
      );
      return;
    }

  
   await this.users.createPlatformOwner({
      email: cfg.email,
      password: cfg.password,
      firstName: cfg.firstName || "Platform Owner",
      lastName: cfg.lastName || "User",
    });

  }
}
