import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
  Logger,
  OnModuleInit,
} from "@nestjs/common";
import { IsNull, MoreThanOrEqual } from "typeorm";
import {
  EResource,
  EScheduleFrequency,
  EScheduleStatus,
  filtersFromListSchema,
  scheduleListQuerySchema,
  type IPaginatedResponse,
  type TCreateScheduleData,
  type TScheduleListQuery,
  type TUpdateScheduleData,
} from "@template/contracts";
import { PermissionsService } from "../base/permissions";
import { RequestContext } from "../context";
import {
  EntityService,
  type IBoundEntityService,
} from "../database";
import { buildEntityQuery, type EntityQueryConfig } from "../query";
import { ScheduleEntity } from "./entities";
import { ScheduleUtils } from "./utils/schedule.utils";
import { ScheduleExecutorService } from "./services/schedule-executor.service";

export const SCHEDULE_QUERY: EntityQueryConfig = {
  alias: "schedule",
  searchable: ["title", "description", "action"],
  sortable: [
    "createdAt",
    "updatedAt",
    "title",
    "status",
    "nextRunDate",
    "startDate",
  ],
  defaultSort: { field: "nextRunDate", order: "ASC" },
  filters: filtersFromListSchema(scheduleListQuerySchema),
};

@Injectable()
export class ScheduleService implements OnModuleInit {
  private readonly logger = new Logger(ScheduleService.name);
  private readonly entity: IBoundEntityService<ScheduleEntity>;

  constructor(
    private readonly entityService: EntityService,
    private readonly permissions: PermissionsService,
    @Inject(forwardRef(() => ScheduleExecutorService))
    private readonly executor: ScheduleExecutorService,
  ) {
    this.entity = this.entityService.bind(ScheduleEntity, SCHEDULE_QUERY);
  }

  async onModuleInit() {
    await this.permissions.ensureResource(EResource.SCHEDULES);
  }

  private triggerSetupIfActive(schedule: ScheduleEntity): void {
    if (schedule.status !== EScheduleStatus.ACTIVE) return;
    setImmediate(() => {
      void this.executor.setupSchedule(schedule).catch((err: Error) => {
        this.logger.error(
          `Failed to setup schedule "${schedule.title}": ${err.message}`,
        );
      });
    });
  }

  async createSchedule(
    input: TCreateScheduleData,
    timezone?: string,
  ): Promise<ScheduleEntity> {
    this.validateScheduleConfig(input);

    if (input.entityId && input.action) {
      const recipientId = input.data?.recipientId;
      const qb = await buildEntityQuery(
        this.entity.getRepository(),
        SCHEDULE_QUERY,
        { page: 1, limit: 1 },
        {
          beforeQuery: (builder) => {
            builder
              .andWhere("schedule.entityId = :entityId", {
                entityId: input.entityId,
              })
              .andWhere("schedule.action = :action", { action: input.action })
              .andWhere("schedule.status = :status", {
                status: EScheduleStatus.ACTIVE,
              });
            if (typeof recipientId === "string") {
              builder.andWhere(
                "schedule.data->>'recipientId' = :recipientId",
                { recipientId },
              );
            }
          },
        },
      );

      const existing = await qb.getOne();
      if (existing) {
        const patch: Partial<ScheduleEntity> = {};
        if (input.title) patch.title = input.title;
        if (input.description !== undefined) {
          patch.description = input.description ?? null;
        }
        if (input.data) {
          patch.data = { ...(existing.data ?? {}), ...input.data };
        }
        if (input.nextRunDate) {
          patch.nextRunDate = new Date(input.nextRunDate);
        }
        const saved = await this.entity.update(existing.id, patch);
        this.triggerSetupIfActive(saved);
        return saved;
      }
    }

    const startDate = new Date(input.startDate || new Date());
    const endDate = input.endDate
      ? new Date(new Date(input.endDate).setHours(23, 59, 59, 999))
      : null;
    const selectedTimezone =
      input.timezone ||
      timezone ||
      RequestContext.get("timezone") ||
      "UTC";

    const frequency = input.frequency ?? EScheduleFrequency.ONCE;
    const cronExpression =
      frequency === EScheduleFrequency.ONCE
        ? null
        : ScheduleUtils.generateCronExpression(
            {
              frequency,
              weekDays: input.weekDays,
              monthDays: input.monthDays,
              months: input.months,
            },
            input.timeOfDay || "00:00",
            0,
          );

    const nextRunDate = input.nextRunDate
      ? new Date(input.nextRunDate)
      : startDate;
    const isActive = !endDate || startDate <= endDate;

    const saved = await this.entity.create({
      title: input.title?.trim() || "Schedule",
      description: input.description ?? null,
      entityId: input.entityId ?? null,
      action: input.action,
      data: input.data ?? null,
      frequency,
      startDate,
      endDate,
      timeOfDay: input.timeOfDay ?? null,
      endTime: input.endTime ?? null,
      intervalValue: input.intervalValue ?? null,
      intervalUnit: input.intervalUnit ?? null,
      interval: input.interval ?? null,
      timezone: selectedTimezone,
      cronExpression,
      weekDays: input.weekDays ?? null,
      monthDays: input.monthDays ?? null,
      months: input.months ?? null,
      status: isActive ? EScheduleStatus.ACTIVE : EScheduleStatus.COMPLETED,
      nextRunDate,
      retryOnFailure: input.retryOnFailure ?? true,
      maxRetries: input.maxRetries ?? 1,
      retryDelayMinutes: input.retryDelayMinutes ?? 15,
    });

    this.triggerSetupIfActive(saved);
    return saved;
  }

  async updateSchedule(
    id: string,
    input: TUpdateScheduleData,
    timezone?: string,
  ): Promise<ScheduleEntity> {
    const schedule = await this.entity.require(id);

    let patch: Partial<ScheduleEntity>;

    if (
      input.startDate ||
      input.frequency ||
      input.timeOfDay ||
      input.weekDays !== undefined ||
      input.monthDays ||
      input.months
    ) {
      const merged = {
        frequency: input.frequency ?? schedule.frequency,
        weekDays: input.weekDays ?? schedule.weekDays ?? undefined,
        monthDays: input.monthDays ?? schedule.monthDays ?? undefined,
        months: input.months ?? schedule.months ?? undefined,
      };
      this.validateScheduleConfig(merged);

      const newStartDate = input.startDate
        ? new Date(input.startDate)
        : schedule.startDate;
      const newEndDate =
        input.endDate !== undefined
          ? input.endDate
            ? new Date(new Date(input.endDate).setHours(23, 59, 59, 999))
            : null
          : schedule.endDate;
      const selectedTimezone =
        input.timezone || timezone || schedule.timezone || "UTC";
      const frequency = input.frequency ?? schedule.frequency;

      const cronExpression =
        frequency === EScheduleFrequency.ONCE
          ? null
          : ScheduleUtils.generateCronExpression(
              {
                frequency,
                weekDays: (input.weekDays ?? schedule.weekDays) ?? undefined,
                monthDays: (input.monthDays ?? schedule.monthDays) ?? undefined,
                months: (input.months ?? schedule.months) ?? undefined,
              },
              input.timeOfDay || schedule.timeOfDay || "00:00",
              0,
            );

      let nextRunDate = schedule.nextRunDate;
      let status = input.status ?? schedule.status;
      if (cronExpression) {
        const calc = ScheduleUtils.calculateNextRun(
          cronExpression,
          newStartDate,
          newEndDate,
          selectedTimezone,
        );
        nextRunDate = calc.nextRunAt;
        if (!calc.isActive) status = EScheduleStatus.COMPLETED;
      }

      patch = {
        ...input,
        startDate: newStartDate,
        endDate: newEndDate,
        cronExpression,
        nextRunDate,
        status,
        timezone: selectedTimezone,
      } as Partial<ScheduleEntity>;
    } else {
      patch = { ...input } as Partial<ScheduleEntity>;
    }

    const saved = await this.entity.update(id, patch);
    this.triggerSetupIfActive(saved);
    return saved;
  }

  findById(id: string): Promise<ScheduleEntity | null> {
    return this.entity.get(id);
  }

  get(id: string): Promise<ScheduleEntity> {
    return this.entity.require(id);
  }

  list(
    query: TScheduleListQuery,
  ): Promise<IPaginatedResponse<ScheduleEntity>> {
    return this.entity.list(query);
  }

  async softDelete(id: string): Promise<void> {
    await this.entity.softDelete(id, {
      beforeDelete: (row) => {
        row.status = EScheduleStatus.CANCELLED;
      },
    });
  }

  async getTodaysSchedules(): Promise<ScheduleEntity[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return this.entity.getRepository().find({
      where: {
        status: EScheduleStatus.ACTIVE,
        nextRunDate: MoreThanOrEqual(today),
        deletedAt: IsNull(),
      },
      order: { timeOfDay: "ASC" },
    });
  }

  async trackExecution(
    id: string,
    success: boolean,
    errorMessage?: string,
  ): Promise<void> {
    const schedule = await this.entity.get(id);
    if (!schedule) return;

    const history = schedule.executionHistory ?? [];
    history.unshift({
      executedAt: new Date(),
      status: success ? "success" : "failed",
      errorMessage: success ? undefined : errorMessage,
    });

    await this.entity.update(id, {
      executionCount: schedule.executionCount + 1,
      lastRunAt: new Date(),
      lastExecutionStatus: success ? "success" : "failed",
      successCount: success
        ? schedule.successCount + 1
        : schedule.successCount,
      failureCount: success
        ? schedule.failureCount
        : schedule.failureCount + 1,
      lastErrorMessage: success ? null : (errorMessage ?? "Unknown error"),
      executionHistory: history.slice(0, 50),
    });
  }

  async executeAndUpdateNext(id: string): Promise<ScheduleEntity> {
    const schedule = await this.entity.require(id);

    const patch: Partial<ScheduleEntity> = {
      lastRunAt: new Date(),
    };

    if (schedule.frequency === EScheduleFrequency.ONCE) {
      patch.status = EScheduleStatus.COMPLETED;
    } else if (schedule.cronExpression) {
      const next = ScheduleUtils.getNextRunDate(
        schedule.cronExpression,
        new Date(),
        schedule.timezone || "UTC",
      );
      if (schedule.endDate && next > schedule.endDate) {
        patch.status = EScheduleStatus.COMPLETED;
      } else {
        patch.nextRunDate = next;
      }
    }

    return this.entity.update(id, patch);
  }

  private validateScheduleConfig(
    dto: Partial<TCreateScheduleData> & { frequency?: EScheduleFrequency },
  ): void {
    switch (dto.frequency) {
      case EScheduleFrequency.WEEKLY:
        if (!dto.weekDays?.length) {
          throw new BadRequestException(
            "weekDays is required for WEEKLY frequency",
          );
        }
        break;
      case EScheduleFrequency.MONTHLY:
        if (!dto.monthDays?.length) {
          throw new BadRequestException(
            "monthDays is required for MONTHLY frequency",
          );
        }
        break;
      case EScheduleFrequency.YEARLY:
        if (!dto.months?.length) {
          throw new BadRequestException(
            "months is required for YEARLY frequency",
          );
        }
        break;
      default:
        break;
    }
  }
}
