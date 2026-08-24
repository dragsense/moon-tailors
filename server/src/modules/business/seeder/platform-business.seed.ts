import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { EUserLevel } from "@moon-tailors/contracts";
import { UsersService } from "../../users/users.service";
import { BusinessService } from "../business.service";

/**
 * Seeds the platform / default business (main DB only — never a tenant DB).
 * Runs in BusinessModule after UsersModule has seeded the platform owner.
 */
@Injectable()
export class PlatformBusinessSeed implements OnModuleInit {
  private readonly logger = new Logger(PlatformBusinessSeed.name);

  constructor(
    private readonly businesses: BusinessService,
    private readonly users: UsersService,
  ) { }

  async onModuleInit() {
    await this.run();
  }

  async run(): Promise<void> {
    const existing = await this.businesses.findPlatform();
    if (existing) {
      this.logger.log(
        `Platform business already exists: ${existing.name} (${existing.id})`,
      );
      return;
    }

    const owner = await this.users.findByLevel(EUserLevel.PLATFORM_OWNER);
    await this.businesses.create(
      { name: "Platform" },
      {
        ownerUserId: owner?.id,
        isPlatform: true,
      },
    );
  }
}
