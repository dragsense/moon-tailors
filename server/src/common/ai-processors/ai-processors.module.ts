import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { BaseBusinessModule } from "../base/business";
import { AiProcessorEntity } from "./entities/ai-processor.entity";
import { AiProcessorsService } from "./ai-processors.service";
import { AiProcessorsController } from "./ai-processors.controller";

@Module({
  imports: [
    TypeOrmModule.forFeature([AiProcessorEntity]),
    BaseBusinessModule,
  ],
  controllers: [AiProcessorsController],
  providers: [AiProcessorsService],
  exports: [AiProcessorsService],
})
export class AiProcessorsModule {}
