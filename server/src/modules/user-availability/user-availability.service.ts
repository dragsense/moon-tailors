import { Injectable, OnModuleInit } from "@nestjs/common";
import {
  EResource,
  type TUpsertUserAvailability,
  type TWeeklySchedule,
} from "@template/contracts";
import { PermissionsService } from "../../common/base";
import {
  EntityService,
  type IBoundEntityService,
} from "../../common/database";
import type { EntityQueryConfig } from "../../common/query";
import { UserAvailabilityEntity } from "./entities/user-availability.entity";

const emptyDay = {
  enabled: false,
  timeSlots: [] as { start: string; end: string }[],
};

export function defaultWeeklySchedule(): TWeeklySchedule {
  return {
    monday: { enabled: true, timeSlots: [{ start: "09:00", end: "17:00" }] },
    tuesday: { enabled: true, timeSlots: [{ start: "09:00", end: "17:00" }] },
    wednesday: { enabled: true, timeSlots: [{ start: "09:00", end: "17:00" }] },
    thursday: { enabled: true, timeSlots: [{ start: "09:00", end: "17:00" }] },
    friday: { enabled: true, timeSlots: [{ start: "09:00", end: "17:00" }] },
    saturday: emptyDay,
    sunday: emptyDay,
  };
}

export const USER_AVAILABILITY_QUERY: EntityQueryConfig = {
  alias: "availability",
  sortable: ["createdAt", "updatedAt"],
  defaultSort: { field: "createdAt", order: "DESC" },
};

@Injectable()
export class UserAvailabilityService implements OnModuleInit {
  private readonly entity: IBoundEntityService<UserAvailabilityEntity>;

  constructor(
    private readonly entityService: EntityService,
    private readonly permissions: PermissionsService,
  ) {
    this.entity = this.entityService.bind(
      UserAvailabilityEntity,
      USER_AVAILABILITY_QUERY,
    );
  }

  async onModuleInit() {
    await this.permissions.ensureResource(EResource.USER_AVAILABILITY);
  }

  async getOrCreateForUser(userId: string): Promise<UserAvailabilityEntity> {
    const existing = await this.entity.get(
      { userId },
      { access: { type: "eq", column: "userId", value: userId } },
    );
    if (existing) return existing;

    return this.entity.create({
      userId,
      weeklySchedule: defaultWeeklySchedule(),
      unavailablePeriods: [],
    });
  }

  /** Single upsert path — create or update by userId. */
  async upsert(
    userId: string,
    input: TUpsertUserAvailability,
  ): Promise<UserAvailabilityEntity> {
    const existing = await this.entity.get(
      { userId },
      { access: { type: "eq", column: "userId", value: userId } },
    );
    if (!existing) {
      return this.entity.create({
        userId,
        weeklySchedule: input.weeklySchedule,
        unavailablePeriods: input.unavailablePeriods ?? [],
      });
    }

    return this.entity.update(existing.id, {
      weeklySchedule: input.weeklySchedule,
      unavailablePeriods: input.unavailablePeriods ?? [],
    });
  }

  getForUser(userId: string): Promise<UserAvailabilityEntity> {
    return this.entity.require(
      { userId },
      { access: { type: "eq", column: "userId", value: userId } },
    );
  }
}
