import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  Res,
  UploadedFile,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { ApiConsumes, ApiTags } from "@nestjs/swagger";
import {
  createFileUploadSchema,
  EPermissionAction,
  EResource,
  fileListQuerySchema,
  updateFileUploadSchema,
  type IFileFolderSummary,
  type IMessageResponse,
  type IPaginatedResponse,
  type TCreateFileUpload,
  type TFileListQuery,
  type TUpdateFileUpload,
} from "@moon-tailors/contracts";
import type { Response } from "express";
import { memoryStorage } from "multer";
import { RequirePermissions } from "../../auth";
import { SkipEncryption } from "../../security";
import { ZodValidationPipe } from "../../validation";
import { FileUploadEntity } from "../entities";
import { FileValidationPipe } from "../pipes/file-validation.pipe";
import { FileUploadService } from "../services/file-upload.service";

@ApiTags("Files")
@Controller("files")
export class FileUploadController {
  constructor(private readonly files: FileUploadService) {}

  @Get()
  @RequirePermissions({
    resource: EResource.FILES,
    action: EPermissionAction.READ,
  })
  list(
    @Query(new ZodValidationPipe(fileListQuerySchema)) query: TFileListQuery,
  ): Promise<IPaginatedResponse<FileUploadEntity>> {
    return this.files.list(query);
  }

  @Get("folders")
  @RequirePermissions({
    resource: EResource.FILES,
    action: EPermissionAction.READ,
  })
  listFolders(): Promise<IFileFolderSummary[]> {
    return this.files.listFolders();
  }

  @Get(":id")
  @RequirePermissions({
    resource: EResource.FILES,
    action: EPermissionAction.READ,
  })
  get(@Param("id") id: string): Promise<FileUploadEntity> {
    return this.files.get(id);
  }

  @Post()
  @RequirePermissions({
    resource: EResource.FILES,
    action: EPermissionAction.CREATE,
  })
  @ApiConsumes("multipart/form-data")
  @UseInterceptors(
    FileInterceptor("file", { storage: memoryStorage() }),
  )
  create(
    @Body(new ZodValidationPipe(createFileUploadSchema))
    body: TCreateFileUpload,
    @UploadedFile(
      new FileValidationPipe({
        maxSize: 50 * 1024 * 1024,
        minSize: 1,
        required: false,
      }),
    )
    file?: Express.Multer.File,
  ): Promise<IMessageResponse> {
    return this.files.create(body, file);
  }

  @Patch(":id")
  @RequirePermissions({
    resource: EResource.FILES,
    action: EPermissionAction.UPDATE,
  })
  @ApiConsumes("multipart/form-data")
  @UseInterceptors(
    FileInterceptor("file", { storage: memoryStorage() }),
  )
  update(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(updateFileUploadSchema))
    body: TUpdateFileUpload,
    @UploadedFile(
      new FileValidationPipe({
        maxSize: 50 * 1024 * 1024,
        minSize: 1,
        required: false,
      }),
    )
    file?: Express.Multer.File,
  ): Promise<IMessageResponse> {
    return this.files.update(id, body, file);
  }

  @Delete(":id")
  @RequirePermissions({
    resource: EResource.FILES,
    action: EPermissionAction.DELETE,
  })
  remove(@Param("id") id: string): Promise<IMessageResponse> {
    return this.files.deleteFile(id);
  }

  @Get(":id/download")
  @SkipEncryption()
  @RequirePermissions({
    resource: EResource.FILES,
    action: EPermissionAction.READ,
  })
  async download(
    @Param("id") id: string,
    @Res() res: Response,
  ): Promise<void> {
    const file = await this.files.get(id);
    try {
      const stream = await this.files.getFileReadStream(file);
      if (file.mimeType) res.setHeader("Content-Type", file.mimeType);
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${file.name}"`,
      );
      stream.pipe(res);
    } catch {
      throw new NotFoundException("File missing on server");
    }
  }
}
