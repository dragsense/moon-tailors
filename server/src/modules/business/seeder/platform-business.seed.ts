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
    let business = await this.businesses.findPlatform();
    if (!business) {
      const owner = await this.users.findByLevel(EUserLevel.PLATFORM_OWNER);
      await this.businesses.create(
        { name: "Platform" },
        {
          ownerUserId: owner?.id,
          isPlatform: true,
        },
      );
      business = await this.businesses.findPlatform();
    } else {
      this.logger.log(
        `Platform business already exists: ${business.name} (${business.id})`,
      );
    }

    await this.attachOwnerToPlatform(business);
  }

  /** Shop owner must live in the platform tenant so tenant-scoped updates work. */
  private async attachOwnerToPlatform(
    business: Awaited<ReturnType<BusinessService["findPlatform"]>>,
  ): Promise<void> {
    if (!business?.tenantId) return;
    const owner = await this.users.findByLevel(EUserLevel.PLATFORM_OWNER);
    if (!owner || owner.tenantId === business.tenantId) return;
    await this.users.attachToTenant(owner.id, business.tenantId);
    this.logger.log(
      `Platform owner ${owner.email} attached to tenant ${business.tenantId}`,
    );
  }
}
