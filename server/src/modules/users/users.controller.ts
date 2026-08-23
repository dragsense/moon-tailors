import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import type {
  IMessageResponse,
  IPaginatedResponse,
  TCreateUserData,
  TUpdateUserData,
  TUserListQuery,
  TUserResponse,
} from "@template/contracts";
import {
  createUserSchema,
  EPermissionAction,
  EResource,
  EUserLevel,
  updateUserSchema,
  userListQuerySchema,
} from "@template/contracts";
import {
  RequirePermissions,
  RequireUserLevels,
} from "../../common/auth";
import type { UserEntity } from "../../common/base";
import { ZodValidationPipe } from "../../common/validation";
import { UsersService } from "./users.service";

@ApiTags("Users")
@Controller("users")
@RequireUserLevels(
  EUserLevel.PLATFORM_OWNER,
  EUserLevel.SUPER_ADMIN,
  EUserLevel.ADMIN,
)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @RequirePermissions({
    resource: EResource.USERS,
    action: EPermissionAction.CREATE,
  })
  create(
    @Body(new ZodValidationPipe(createUserSchema)) body: TCreateUserData,
  ): Promise<TUserResponse> {
    return this.usersService.create(body);
  }

  @Get()
  @RequirePermissions({
    resource: EResource.USERS,
    action: EPermissionAction.READ,
  })
  list(
    @Query(new ZodValidationPipe(userListQuerySchema)) query: TUserListQuery,
  ): Promise<IPaginatedResponse<UserEntity>> {
    return this.usersService.list(query);
  }

  @Get(":id")
  @RequirePermissions({
    resource: EResource.USERS,
    action: EPermissionAction.READ,
  })
  get(@Param("id") id: string): Promise<UserEntity> {
    return this.usersService.get(id);
  }

  @Patch(":id")
  @RequirePermissions({
    resource: EResource.USERS,
    action: EPermissionAction.UPDATE,
  })
  update(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(updateUserSchema)) body: TUpdateUserData,
  ): Promise<IMessageResponse> {
    return this.usersService.update(id, body);
  }

  @Delete(":id")
  @RequirePermissions({
    resource: EResource.USERS,
    action: EPermissionAction.DELETE,
  })
  remove(@Param("id") id: string): Promise<IMessageResponse> {
    return this.usersService.remove(id);
  }
}
