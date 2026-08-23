import { Process, Processor } from "@nestjs/bull";
import { Injectable, Logger } from "@nestjs/common";
import type { Job } from "bull";
import { ActionRegistryService } from "../../actions";
import { RequestContext } from "../../context";
import { ScheduleService } from "../schedule.service";

type ScheduleJobData = {
  action: string;
  tenantId?: string | null;
  entityId?: string | null;
  scheduleId?: string;
  userId?: string;
  timezone?: string;
  [key: string]: unknown;
};

@Processor("schedule")
@Injectable()
export class ScheduleProcessor {
  private readonly logger = new Logger(ScheduleProcessor.name);

  constructor(
    private readonly actions: ActionRegistryService,
    private readonly schedules: ScheduleService,
  ) {}

  @Process("*")
  async handleScheduledJob(job: Job<ScheduleJobData>): Promise<void> {
    const { action, tenantId, scheduleId, entityId, userId, timezone, ...data } =
      job.data;

    this.logger.log(
      `Job ${job.id} action=${action}${tenantId ? ` tenant=${tenantId}` : ""}`,
    );

    try {
      await RequestContext.run(async () => {
        if (tenantId) RequestContext.set("tenantId", tenantId);
        if (timezone) RequestContext.set("timezone", timezone);
        if (userId) RequestContext.set("userId", userId);

        const handler = this.actions.getAction(action);
        if (!handler) {
          this.logger.warn(`No handler for action: ${action}`);
          return;
        }

        await handler.handler(
          { ...data, tenantId, timezone } as Record<string, unknown>,
          entityId ?? undefined,
          userId,
        );
      });

      if (scheduleId) {
        await this.schedules.trackExecution(scheduleId, true);
        await this.schedules.executeAndUpdateNext(scheduleId);
      }
      this.logger.log(`Job ${job.id} completed`);
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      if (scheduleId) {
        await this.schedules.trackExecution(scheduleId, false, msg);
      }
      this.logger.error(`Job ${job.id} failed: ${msg}`);
      throw error;
    }
  }
}
