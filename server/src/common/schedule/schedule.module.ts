import { Module, OnModuleInit } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { BullModule } from "@nestjs/bull";
import { BullBoardModule } from "@bull-board/nestjs";
import { BullAdapter } from "@bull-board/api/bullAdapter";
import { ScheduleModule as NestScheduleModule } from "@nestjs/schedule";
import { isBullBoardEnabled } from "../../config/bull-board.config";
import { BaseBusinessModule } from "../base/business";
import { PermissionsModule } from "../base/permissions";
import { ActionModule, ActionRegistryService } from "../actions";
import { ScheduleEntity } from "./entities";
import { ScheduleService } from "./schedule.service";
import { ScheduleController } from "./schedule.controller";
import { ScheduleExecutorService } from "./services/schedule-executor.service";
import { ScheduleProcessor } from "./services/schedule.processor";
import { ActivityLogRegistry } from "../activity-logs";
import { DomainEventRegistry } from "../events";

/** Queue name modules can also register beside feature processors. */
export const SCHEDULE_QUEUE = "schedule";

@Module({
  imports: [
    NestScheduleModule.forRoot(),
    TypeOrmModule.forFeature([ScheduleEntity]),
    BullModule.registerQueue({ name: SCHEDULE_QUEUE }),
    ...(isBullBoardEnabled()
      ? [
          BullBoardModule.forFeature({
            name: SCHEDULE_QUEUE,
            adapter: BullAdapter,
          }),
        ]
      : []),
    BaseBusinessModule,
    PermissionsModule,
    ActionModule,
  ],
  controllers: [ScheduleController],
  providers: [ScheduleService, ScheduleExecutorService, ScheduleProcessor],
  exports: [ScheduleService, ScheduleExecutorService, BullModule],
})
export class ScheduleModule implements OnModuleInit {
  constructor(private readonly actions: ActionRegistryService) {}

  onModuleInit() {
    ActivityLogRegistry.register({
      module: "schedules",
      endpoints: ["/api/schedules"],
      methods: ["POST", "PUT", "PATCH", "DELETE"],
    });
    DomainEventRegistry.register({
      module: "schedules",
      events: { endpoint: "/api/schedules" },
    });

    // Demo/no-op action — replace by registering real handlers from feature modules.
    this.actions.registerAction("schedule.ping", {
      description: "No-op schedule health action",
      handler: async (data) => ({
        ok: true,
        at: new Date().toISOString(),
        data,
      }),
    });
  }
}
