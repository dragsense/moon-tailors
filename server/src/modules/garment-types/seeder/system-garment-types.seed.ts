import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { SYSTEM_GARMENT_TYPES } from "@moon-tailors/contracts";
import { GarmentTypesService } from "../garment-types.service";

/**
 * Seeds built-in gents/ladies garment types once on boot.
 * Shop edits to names are kept; missing rows are inserted.
 */
@Injectable()
export class SystemGarmentTypesSeed implements OnModuleInit {
  private readonly logger = new Logger(SystemGarmentTypesSeed.name);

  constructor(private readonly garmentTypes: GarmentTypesService) {}

  async onModuleInit() {
    await this.run();
  }

  async run(): Promise<void> {
    let created = 0;
    for (const type of SYSTEM_GARMENT_TYPES) {
      const existing = await this.garmentTypes.findBySlug(type.slug, true);
      if (existing) {
        if (existing.deletedAt) continue;
        if (!existing.isSystem) {
          await this.garmentTypes.markAsSystem(existing.id);
        }
        continue;
      }
      await this.garmentTypes.createSystem(type);
      created += 1;
    }

    if (created === 0) {
      this.logger.log(
        `System garment types already exist (${SYSTEM_GARMENT_TYPES.length})`,
      );
      return;
    }

    this.logger.log(`Seeded ${created} system garment types`);
  }
}
