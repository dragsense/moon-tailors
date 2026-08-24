import {
  Controller,
} from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";

import {
  EUserLevel,
} from "@moon-tailors/contracts";
import {
  RequireUserLevels,
} from "../../common/auth";
import { UsersService } from "./users.service";

@ApiTags("Users")
@Controller("users")
@RequireUserLevels(EUserLevel.PLATFORM_OWNER)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}
}
