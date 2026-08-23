import {
  forwardRef,
  Inject,
  Injectable,
  Logger,
  OnModuleInit,
} from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { InjectQueue } from "@nestjs/bull";
import type { Queue } from "bull";
import { IsNull, Not } from "typeorm";
import { BUSINESS_QUERY, BusinessEntity } from "../../base/business";
import { RequestContext } from "../../context";
import {
  EntityService,
  type IBoundEntityService,
} from "../../database";
import { ScheduleEntity } from "../entities";
import { ScheduleService } from "../schedule.service";

@Injectable()
export class ScheduleExecutorService implements OnModuleInit {
  private readonly logger = new Logger(ScheduleExecutorService.name);
  private readonly businesses: IBoundEntityService<BusinessEntity>;

  constructor(
    private readonly entityService: EntityService,
    @Inject(forwardRef(() => ScheduleService))
    private readonly scheduleService: ScheduleService,
    @InjectQueue("schedule") private readonly scheduleQueue: Queue,
  ) {
    this.businesses = this.entityService.bind(BusinessEntity, BUSINESS_QUERY);
  }

  async onModuleInit() {
    this.logger.log("Schedule executor ready");
  }

  /** Midnight: load today's active schedules into Bull (main + tenants). */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async setupDailySchedules() {
    this.logger.log("Setting up schedules for today…");
    await this.cleanupPreviousSchedules();
    await this.setupSchedulesForTenant(null);

    const tenants = await this.businesses.getRepository().find({
      where: { tenantId: Not(IsNull()), deletedAt: IsNull(), isActive: true },
      select: ["id", "tenantId"],
    });

    for (const business of tenants) {
      if (business.tenantId) {
        await this.setupSchedulesForTenant(business.tenantId);
      }
    }
    this.logger.log("Daily schedule setup complete");
  }

  private async setupSchedulesForTenant(
    tenantId: string | null): Promise<void> {
    await RequestContext.run(async () => {
      if (tenantId) RequestContext.set("tenantId", tenantId);
      try {
        const today = await this.scheduleService.getTodaysSchedules();
        for (const schedule of today) {
          await this.setupSchedule(schedule);
        }
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        this.logger.error(
          `Failed schedules for ${tenantId ?? "main"}: ${msg}`);
      }
    });
  }

  private async cleanupPreviousSchedules(): Promise<void> {
    try {
      const jobs = await this.scheduleQueue.getJobs([
        "waiting",
        "active",
        "completed",
        "failed",
        "delayed",
      ]);
      await Promise.allSettled(jobs.map((job) => job.remove()));
      await Promise.all([
        this.scheduleQueue.clean(0, "completed"),
        this.scheduleQueue.clean(0, "failed"),
      ]);
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Cleanup failed: ${msg}`);
    }
  }

  async setupSchedule(schedule: ScheduleEntity): Promise<void> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const next = new Date(schedule.nextRunDate);
      next.setHours(0, 0, 0, 0);
      if (next.getTime() === today.getTime()) {
        await this.scheduleJob(schedule);
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Setup ${schedule.title} failed: ${msg}`);
    }
  }

  private async scheduleJob(schedule: ScheduleEntity): Promise<void> {
    const timeOfDay = schedule.timeOfDay || "00:00";
    const [startHour, startMinute] = timeOfDay.split(":").map(Number);
    const startTime = new Date();
    startTime.setHours(startHour, startMinute, 0, 0);

    const jobOptions: {
      delay: number;
      removeOnFail: number;
      attempts: number;
      repeat?: { every: number; until: Date };
    } = {
      delay: Math.max(0, startTime.getTime() - Date.now()),
      removeOnFail: schedule.retryOnFailure ? 50 : 0,
      attempts: schedule.retryOnFailure ? schedule.maxRetries : 1,
    };

    if (schedule.interval) {
      const endTimeStr = schedule.endTime || "23:59";
      const [endHour, endMinute] = endTimeStr.split(":").map(Number);
      const endTime = new Date();
      endTime.setHours(endHour, endMinute, 0, 0);
      if (endTime <= new Date()) endTime.setDate(endTime.getDate() + 1);
      jobOptions.repeat = {
        every: schedule.interval * 60 * 1000,
        until: endTime,
      };
    }

    const job = await this.scheduleQueue.add(
      schedule.action,
      {
        ...(schedule.data ?? {}),
        date: schedule.nextRunDate,
        action: schedule.action,
        scheduleId: schedule.id,
        isRepeating: Boolean(schedule.interval),
        entityId: schedule.entityId,
        tenantId: schedule.tenantId,
        timezone: schedule.timezone,
      },
      jobOptions);

    this.logger.log(
      `Queued ${schedule.title} → job ${job.id} (${timeOfDay})`);
  }
}
