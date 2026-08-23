import { Column, Entity, Index } from "typeorm";
import { GeneralBaseEntity } from "../../../common/entities";
import type { TUnavailablePeriod, TWeeklySchedule } from "@template/contracts";

@Entity("user_availabilities")
export class UserAvailabilityEntity extends GeneralBaseEntity {
  @Index({ unique: true })
  @Column({ type: "uuid" })
  userId!: string;

  @Column({ type: "jsonb" })
  weeklySchedule!: TWeeklySchedule;

  @Column({ type: "jsonb", default: [] })
  unavailablePeriods!: TUnavailablePeriod[];
}
