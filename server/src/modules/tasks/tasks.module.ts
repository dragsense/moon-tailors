import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { PermissionsModule } from "../../common/base";
import { UsersModule } from "../users/users.module";
import { TaskEntity } from "./entities/task.entity";
import { TaskEventListener } from "./services/task-event-listener.service";
import { TasksController } from "./tasks.controller";
import { TasksService } from "./tasks.service";

/**
 * TypeOrmModule.forFeature registers entity metadata.
 * Runtime CRUD uses EntityRouterService.getRepository (tenant or main DS).
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([TaskEntity]),
    UsersModule,
    PermissionsModule,
  ],
  controllers: [TasksController],
  providers: [TasksService, TaskEventListener],
  exports: [TasksService],
})
export class TasksModule {}
