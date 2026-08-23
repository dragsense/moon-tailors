import { Body, Controller, Get, Post } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import {
  EPermissionAction,
  EResource,
  EUserLevel,
  aiCompletionRequestSchema,
  type IAiCompletionResponse,
  type TAiCompletionRequest,
} from "@template/contracts";
import { RequirePermissions, RequireUserLevels } from "../../common/auth";
import { ZodValidationPipe } from "../../common/validation";
import { AiAdapterService } from "./ai-adapter.service";

@ApiTags("AI")
@Controller("ai")
@RequireUserLevels(
  EUserLevel.PLATFORM_OWNER,
  EUserLevel.SUPER_ADMIN,
  EUserLevel.ADMIN,
)
export class AiAdapterController {
  constructor(private readonly ai: AiAdapterService) {}

  @Get("current")
  @RequirePermissions({
    resource: EResource.AI,
    action: EPermissionAction.READ,
  })
  current() {
    return this.ai.getCurrent();
  }

  @Post("completions")
  @RequirePermissions({
    resource: EResource.AI,
    action: EPermissionAction.CREATE,
  })
  complete(
    @Body(new ZodValidationPipe(aiCompletionRequestSchema))
    body: TAiCompletionRequest,
  ): Promise<IAiCompletionResponse> {
    return this.ai.complete(body);
  }
}
