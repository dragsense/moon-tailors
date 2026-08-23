import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Put,
  UploadedFiles,
  UseInterceptors,
} from "@nestjs/common";
import { FileFieldsInterceptor } from "@nestjs/platform-express";
import { ApiConsumes, ApiTags } from "@nestjs/swagger";
import {
  EPermissionAction,
  EResource,
  EUserLevel,
  upsertBusinessThemeSchema,
  type TUpsertBusinessThemeData,
} from "@template/contracts";
import {
  CurrentUser,
  Public,
  RequirePermissions,
  RequireUserLevels,
} from "../../../common/auth";
import type { BusinessThemeEntity, UserEntity } from "../../../common/base";
import { ZodValidationPipe } from "../../../common/validation";
import { BusinessThemeService } from "../services/business-theme.service";

const MAX_LOGO_SIZE = 2 * 1024 * 1024;
const MAX_FAVICON_SIZE = 512 * 1024;

@ApiTags("Business Theme")
@Controller("business-theme")
export class BusinessThemeController {
  constructor(private readonly themes: BusinessThemeService) {}

  @Get("current")
  @Public()
  getCurrent(): Promise<BusinessThemeEntity> {
    return this.themes.getCurrent();
  }

  @Get("my-theme")
  @RequireUserLevels(
    EUserLevel.PLATFORM_OWNER,
    EUserLevel.SUPER_ADMIN,
    EUserLevel.ADMIN,
  )
  @RequirePermissions({
    resource: EResource.BUSINESSES,
    action: EPermissionAction.READ,
  })
  getMyTheme(@CurrentUser() user: UserEntity): Promise<BusinessThemeEntity> {
    return this.themes.getMyTheme(user);
  }

  @Put()
  @RequireUserLevels(
    EUserLevel.PLATFORM_OWNER,
    EUserLevel.SUPER_ADMIN,
    EUserLevel.ADMIN,
  )
  @RequirePermissions({
    resource: EResource.BUSINESSES,
    action: EPermissionAction.UPDATE,
  })
  @ApiConsumes("multipart/form-data", "application/json")
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: "logoLight", maxCount: 1 },
      { name: "logoDark", maxCount: 1 },
      { name: "favicon", maxCount: 1 },
    ]),
  )
  upsert(
    @Body(new ZodValidationPipe(upsertBusinessThemeSchema))
    body: TUpsertBusinessThemeData,
    @UploadedFiles()
    files: {
      logoLight?: Express.Multer.File[];
      logoDark?: Express.Multer.File[];
      favicon?: Express.Multer.File[];
    },
    @CurrentUser() user: UserEntity,
  ): Promise<BusinessThemeEntity> {
    if (files?.logoLight?.[0] && files.logoLight[0].size > MAX_LOGO_SIZE) {
      throw new BadRequestException("Logo light exceeds 2MB");
    }
    if (files?.logoDark?.[0] && files.logoDark[0].size > MAX_LOGO_SIZE) {
      throw new BadRequestException("Logo dark exceeds 2MB");
    }
    if (files?.favicon?.[0] && files.favicon[0].size > MAX_FAVICON_SIZE) {
      throw new BadRequestException("Favicon exceeds 512KB");
    }
    return this.themes.upsertMyTheme(user, body, files);
  }
}
