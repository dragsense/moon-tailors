import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import {
  EPermissionAction,
  EResource,
  apiKeyListQuerySchema,
  createApiKeySchema,
  type ICreateApiKeyResponse,
  type IPaginatedResponse,
  type TApiKeyListQuery,
  type TCreateApiKeyData,
} from "@template/contracts";
import {
  CurrentUser,
  JwtOnly,
  RequirePermissions,
} from "../../common/auth/decorators/auth.decorators";
import type { UserEntity } from "../../common/base";
import { ZodValidationPipe } from "../../common/validation";
import { ApiKeyEntity } from "./entities/api-key.entity";
import { ApiKeysService } from "./api-keys.service";

/**
 * Manage personal API keys (JWT session only — keys cannot mint/revoke keys).
 * Authenticate machine clients with `Authorization: Bearer <key>` or `X-Api-Key`.
 */
@ApiTags("API Keys")
@ApiBearerAuth("access-token")
@JwtOnly()
@Controller("api-keys")
export class ApiKeysController {
  constructor(private readonly apiKeys: ApiKeysService) {}

  @Get()
  @RequirePermissions({
    resource: EResource.API_KEYS,
    action: EPermissionAction.READ,
  })
  list(
    @CurrentUser() user: UserEntity,
    @Query(new ZodValidationPipe(apiKeyListQuerySchema))
    query: TApiKeyListQuery,
  ): Promise<IPaginatedResponse<ApiKeyEntity>> {
    return this.apiKeys.listForUser(user.id, query);
  }

  @Post()
  @RequirePermissions({
    resource: EResource.API_KEYS,
    action: EPermissionAction.CREATE,
  })
  create(
    @CurrentUser() user: UserEntity,
    @Body(new ZodValidationPipe(createApiKeySchema)) body: TCreateApiKeyData,
  ): Promise<ICreateApiKeyResponse> {
    return this.apiKeys.create(user.id, body);
  }

  @Delete(":id")
  @HttpCode(200)
  @RequirePermissions({
    resource: EResource.API_KEYS,
    action: EPermissionAction.DELETE,
  })
  revoke(
    @CurrentUser() user: UserEntity,
    @Param("id", ParseUUIDPipe) id: string,
  ): Promise<{ message: string }> {
    return this.apiKeys.revoke(user.id, id);
  }
}
