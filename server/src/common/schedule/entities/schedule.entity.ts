import { Column, Entity, Index } from "typeorm";
import {
  EDayOfWeek,
  EIntervalUnit,
  EScheduleFrequency,
  EScheduleStatus,
} from "@template/contracts";
import { GeneralBaseEntity } from "../../entities";

@Entity("schedules")
export class ScheduleEntity extends GeneralBaseEntity {
  @Column({ type: "varchar", length: 255, default: "Schedule" })
  title!: string;

  @Column({ type: "text", nullable: true })
  description!: string | null;

  @Index()
  @Column({ type: "uuid", nullable: true })
  entityId!: string | null;

  /** Registered action name (ActionRegistryService). */
  @Column({ type: "varchar", length: 255 })
  action!: string;

  @Column({ type: "jsonb", nullable: true })
  data!: Record<string, unknown> | null;

  /** Optional tenant routing key for multi-db jobs. */
  @Index()
  @Column({ type: "uuid", nullable: true })
  tenantId!: string | null;

  @Column({
    type: "varchar",
    length: 32,
    default: EScheduleFrequency.ONCE,
  })
  frequency!: EScheduleFrequency;

  @Column({ type: "date" })
  startDate!: Date;

  @Column({ type: "date", nullable: true })
  endDate!: Date | null;

  @Column({ type: "varchar", length: 8, nullable: true })
  timeOfDay!: string | null;

  @Column({ type: "varchar", length: 8, nullable: true })
  endTime!: string | null;

  @Column({ type: "int", nullable: true })
  intervalValue!: number | null;

  @Column({ type: "varchar", length: 16, nullable: true })
  intervalUnit!: EIntervalUnit | null;

  /** Interval in minutes (for Bull repeat). */
  @Column({ type: "int", nullable: true })
  interval!: number | null;

  @Column({ type: "varchar", length: 64, default: "UTC" })
  timezone!: string;

  @Column({ type: "varchar", length: 128, nullable: true })
  cronExpression!: string | null;

  @Column({ type: "int", array: true, nullable: true })
  weekDays!: EDayOfWeek[] | null;

  @Column({ type: "int", array: true, nullable: true })
  monthDays!: number[] | null;

  @Column({ type: "int", array: true, nullable: true })
  months!: number[] | null;

  @Column({
    type: "varchar",
    length: 32,
    default: EScheduleStatus.ACTIVE,
  })
  status!: EScheduleStatus;

  @Column({ type: "timestamptz" })
  nextRunDate!: Date;

  @Column({ type: "timestamptz", nullable: true })
  lastRunAt!: Date | null;

  @Column({ type: "int", default: 0 })
  executionCount!: number;

  @Column({ type: "int", default: 0 })
  successCount!: number;

  @Column({ type: "int", default: 0 })
  failureCount!: number;

  @Column({ type: "varchar", length: 32, nullable: true })
  lastExecutionStatus!: string | null;

  @Column({ type: "text", nullable: true })
  lastErrorMessage!: string | null;

  @Column({ type: "jsonb", nullable: true })
  executionHistory!: Array<{
    executedAt: Date;
    status: "success" | "failed";
    errorMessage?: string;
  }> | null;

  @Column({ type: "boolean", default: true })
  retryOnFailure!: boolean;

  @Column({ type: "int", default: 1 })
  maxRetries!: number;

  @Column({ type: "int", default: 0 })
  currentRetries!: number;

  @Column({ type: "int", default: 15 })
  retryDelayMinutes!: number;
}
