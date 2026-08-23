import { Module } from "@nestjs/common";
import { TasksApiService } from "./api/tasks.service";
import { TasksTools } from "./tools/tasks.tools";

@Module({
  providers: [TasksApiService, TasksTools],
  exports: [TasksTools],
})
export class TasksModule {}
