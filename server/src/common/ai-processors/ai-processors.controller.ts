import { Controller, Get, Query } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import {
  aiProcessorListQuerySchema,
  EUserLevel,
  type IPaginatedResponse,
  type TAiProcessorListQuery,
} from "@template/contracts";
import { RequireUserLevels } from "../auth";
import { ZodValidationPipe } from "../validation";
import { AiProcessorEntity } from "./entities/ai-processor.entity";
import { AiProcessorsService } from "./ai-processors.service";

@ApiTags("AI processors")
@Controller("ai-processors")
@RequireUserLevels(
  EUserLevel.PLATFORM_OWNER,
  EUserLevel.SUPER_ADMIN,
  EUserLevel.ADMIN,
)
export class AiProcessorsController {
  constructor(private readonly processors: AiProcessorsService) {}

  @Get("current")
  current() {
    return this.processors.resolveForCurrentBusiness();
  }

  @Get()
  list(
    @Query(new ZodValidationPipe(aiProcessorListQuerySchema))
    query: TAiProcessorListQuery,
  ): Promise<IPaginatedResponse<AiProcessorEntity>> {
    return this.processors.list(query);
  }
}
