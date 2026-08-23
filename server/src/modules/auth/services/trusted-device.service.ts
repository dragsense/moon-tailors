import { Injectable } from "@nestjs/common";
import {
  EntityService,
  type IBoundEntityService,
} from "../../../common/database";
import type { EntityQueryConfig } from "../../../common/query";
import { TrustedDeviceEntity } from "../entities/trusted-device.entity";

export const TRUSTED_DEVICE_QUERY: EntityQueryConfig = {
  alias: "trustedDevice",
  restrictedFields: ["passwordHash"],
  sortable: ["createdAt"],
  defaultSort: { field: "createdAt", order: "DESC" },
};

@Injectable()
export class TrustedDeviceService {
  private readonly entity: IBoundEntityService<TrustedDeviceEntity>;

  constructor(private readonly entityService: EntityService) {
    this.entity = this.entityService.bind(
      TrustedDeviceEntity,
      TRUSTED_DEVICE_QUERY,
    );
  }

  async isTrusted(userId: string, deviceId?: string | null): Promise<boolean> {
    const id = deviceId?.trim();
    if (!id) return false;
    const row = await this.entity.get({ userId, deviceId: id });
    return row != null;
  }

  async remember(
    userId: string,
    deviceId: string,
    meta?: { userAgent?: string; ipAddress?: string; deviceName?: string },
  ): Promise<void> {
    const id = deviceId.trim();
    if (!id) return;

    const existing = await this.entity.get({ userId, deviceId: id });
    if (existing) {
      await this.entity.update(existing.id, {
        userAgent: meta?.userAgent ?? existing.userAgent,
        ipAddress: meta?.ipAddress ?? existing.ipAddress,
        deviceName: meta?.deviceName ?? existing.deviceName,
      });
      return;
    }

    await this.entity.create({
      userId,
      deviceId: id,
      deviceName: meta?.deviceName ?? null,
      userAgent: meta?.userAgent ?? null,
      ipAddress: meta?.ipAddress ?? null,
    });
  }

  async removeAllForUser(userId: string): Promise<void> {
    await this.entity.getRepository().delete({ userId });
  }
}
