import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { EUserLevel } from "@moon-tailors/contracts";
import { BaseUsersService } from "../../users/base-users.service";
import { BaseBusinessService } from "../base-business.service";

/**
 * Seeds the platform / default business + theme (main DB only — never a tenant DB).
 * Runs in BaseBusinessModule after BaseUsersModule has seeded the platform owner.
 */
@Injectable()
export class PlatformBusinessSeed implements OnModuleInit {
  private readonly logger = new Logger(PlatformBusinessSeed.name);

  constructor(
    private readonly businesses: BaseBusinessService,
    private readonly users: BaseUsersService,
  ) {}

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
    const business = await this.businesses.create(
      { name: "Platform" },
      {
        ownerUserId: owner?.id,
        isPlatform: true,
      },
    );

    this.logger.log(
      `Platform business seeded: ${business.name} (${business.id}) tenant=${business.tenantId} (main DB)`,
    );
  }
}
