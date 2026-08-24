import {
  Body,
  Controller,
  Get,
  Patch,
} from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import type {
  IMeUser,
  IMessageResponse,
  TChangePasswordData,
  TUpdateMeData,
} from "@moon-tailors/contracts";
import {
  changePasswordSchema,
  updateMeSchema,
} from "@moon-tailors/contracts";
import type { UserEntity } from "../../common/base";
import { CurrentUser, JwtOnly } from "../../common/auth";
import { ZodValidationPipe } from "../../common/validation";
import { UsersService } from "./users.service";

@ApiTags("Users")
@Controller("users")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get("me")
  @JwtOnly()
  getMe(@CurrentUser() user: UserEntity): Promise<IMeUser> {
    return this.usersService.getMe(user);
  }

  @Patch("me")
  @JwtOnly()
  updateMe(
    @CurrentUser() user: UserEntity,
    @Body(new ZodValidationPipe(updateMeSchema)) body: TUpdateMeData,
  ): Promise<IMeUser> {
    return this.usersService.updateMe(user, body);
  }

  @Patch("me/password")
  @JwtOnly()
  changePassword(
    @CurrentUser() user: UserEntity,
    @Body(new ZodValidationPipe(changePasswordSchema))
    body: TChangePasswordData,
  ): Promise<IMessageResponse> {
    return this.usersService.changePassword(user, body);
  }
}
