import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from "@nestjs/common";
import {
  EResource,
  fileListQuerySchema,
  filtersFromListSchema,
  isSystemFileFolder,
  USER_UPLOAD_FOLDER,
  type IFileFolderSummary,
  type IMessageResponse,
  type IPaginatedResponse,
  type TCreateFileUpload,
  type TFileListQuery,
  type TUpdateFileUpload,
} from "@moon-tailors/contracts";
import type { Readable } from "node:stream";
import { PermissionsService } from "../../base";
import {
  EntityService,
  type IBoundEntityService,
} from "../../database";
import type { EntityKey, EntityQueryConfig } from "../../query";
import { FileUploadEntity } from "../entities";
import {
  buildUploadKey,
  STORAGE_PROVIDER,
  type StorageProvider,
} from "../storage/interfaces/storage-provider.interface";
import { detectFileType } from "../utils/detect-file-type";

export const FILE_UPLOAD_QUERY: EntityQueryConfig = {
  alias: "file",
  searchable: ["name", "originalName", "folder"],
  sortable: ["createdAt", "name", "size", "folder"],
  defaultSort: { field: "createdAt", order: "DESC" },
  filters: filtersFromListSchema(fileListQuerySchema),
};

@Injectable()
export class FileUploadService implements OnModuleInit {
  private readonly entity: IBoundEntityService<FileUploadEntity>;

  constructor(
    private readonly entityService: EntityService,
    @Inject(STORAGE_PROVIDER)
    private readonly storage: StorageProvider,
    private readonly permissions: PermissionsService,
  ) {
    this.entity = this.entityService.bind(FileUploadEntity, FILE_UPLOAD_QUERY);
  }

  async onModuleInit() {
    await this.permissions.ensureResource(EResource.FILES);
  }

  /**
   * Persist file metadata (+ optional storage upload).
   * Returns the entity for internal callers (e.g. themes, saveFile:false flows).
   * HTTP create path should return {@link create} message response.
   */
  async createFile(
    input: TCreateFileUpload,
    file?: Express.Multer.File,
    saveFile = true,
  ): Promise<FileUploadEntity> {
    const folder = input.folder?.trim() || USER_UPLOAD_FOLDER;

    if (file) {
      const relativePath = buildUploadKey(folder, file.originalname);
      if (saveFile) {
        await this.storage.upload(relativePath, file.buffer, file.mimetype);
      }
      return this.entity.create({
        name: input.name?.trim() || file.originalname,
        originalName: file.originalname,
        type: detectFileType(file.mimetype),
        mimeType: file.mimetype,
        size: file.size,
        path: relativePath,
        folder,
        url: this.storage.getPublicUrl(relativePath),
      });
    }

    if (input.url) {
      return this.entity.create({
        name: input.name?.trim() || "remote-file",
        originalName: input.name?.trim() || "remote-file",
        type: input.type ?? detectFileType(""),
        mimeType: "",
        size: 0,
        path: input.url,
        folder,
        url: input.url,
      });
    }

    throw new BadRequestException("Either file or url must be provided");
  }

  async create(
    input: TCreateFileUpload,
    file?: Express.Multer.File,
  ): Promise<IMessageResponse> {
    await this.createFile(input, file);
    return { message: "File created" };
  }

  async updateFile(
    id: string,
    input: TUpdateFileUpload,
    file?: Express.Multer.File,
    saveFile = true,
  ): Promise<FileUploadEntity> {
    const existing = await this.entity.require(id);
    const patch: Partial<FileUploadEntity> = {};

    if (file) {
      if (saveFile && existing.path) {
        await this.deleteStoredFile(existing.path);
      }
      const relativePath = buildUploadKey(
        existing.folder,
        file.originalname,
      );
      if (saveFile) {
        await this.storage.upload(relativePath, file.buffer, file.mimetype);
      }
      patch.name = input.name?.trim() || file.originalname;
      patch.originalName = file.originalname;
      patch.type = detectFileType(file.mimetype);
      patch.mimeType = file.mimetype;
      patch.size = file.size;
      patch.path = relativePath;
      patch.url = this.storage.getPublicUrl(relativePath);
    } else {
      if (input.name !== undefined) patch.name = input.name.trim();
      if (input.type !== undefined) patch.type = input.type;
    }

    return this.entity.update(id, patch);
  }

  async update(
    id: string,
    input: TUpdateFileUpload,
    file?: Express.Multer.File,
  ): Promise<IMessageResponse> {
    await this.updateFile(id, input, file);
    return { message: "File updated" };
  }

  list(
    query: TFileListQuery,
  ): Promise<IPaginatedResponse<FileUploadEntity>> {
    return this.entity.list(query);
  }

  get(key: EntityKey): Promise<FileUploadEntity> {
    return this.entity.require(key);
  }

  async listFolders(): Promise<IFileFolderSummary[]> {
    const rows = await this.entity
      .getRepository()
      .createQueryBuilder("file")
      .select("file.folder", "folder")
      .addSelect("COUNT(*)", "count")
      .where("file.deletedAt IS NULL")
      .groupBy("file.folder")
      .orderBy("file.folder", "ASC")
      .getRawMany<{ folder: string; count: string }>();

    const folders = rows.map((row) => ({
      folder: row.folder || USER_UPLOAD_FOLDER,
      count: Number(row.count) || 0,
      isSystem: isSystemFileFolder(row.folder),
    }));

    if (!folders.some((item) => item.folder === USER_UPLOAD_FOLDER)) {
      folders.unshift({
        folder: USER_UPLOAD_FOLDER,
        count: 0,
        isSystem: false,
      });
    }

    return folders.sort((a, b) => {
      if (a.folder === USER_UPLOAD_FOLDER) return -1;
      if (b.folder === USER_UPLOAD_FOLDER) return 1;
      return a.folder.localeCompare(b.folder);
    });
  }

  assertCanDeleteFromFileManager(file: FileUploadEntity): void {
    if (isSystemFileFolder(file.folder)) {
      throw new ForbiddenException(
        `Files in the system folder "${file.folder}" cannot be deleted from the file manager`,
      );
    }
  }

  async deleteFile(
    id: string,
    options?: { allowSystemFolder?: boolean },
  ): Promise<IMessageResponse> {
    await this.entity.softDelete(id, {
      beforeDelete: async (file) => {
        if (!options?.allowSystemFolder) {
          this.assertCanDeleteFromFileManager(file);
        }
        await this.deleteStoredFile(file.path);
      },
    });
    return { message: "File deleted" };
  }

  /** Persist bytes after a transactional DB insert (`saveFile: false`). */
  async saveFiles(
    items: { file: Express.Multer.File; fileUpload: FileUploadEntity }[],
  ): Promise<void> {
    for (const item of items) {
      if (!item.fileUpload.path) {
        throw new BadRequestException("File path missing");
      }
      await this.storage.upload(
        item.fileUpload.path,
        item.file.buffer,
        item.file.mimetype,
      );
    }
  }

  async deleteFiles(files: FileUploadEntity[]): Promise<void> {
    for (const file of files) {
      await this.deleteFile(file.id, { allowSystemFolder: true });
    }
  }

  async getFileReadStream(file: FileUploadEntity): Promise<Readable> {
    if (!file.path) throw new NotFoundException("File path missing");
    if (this.storage.getLegacyLocalReadStream) {
      const legacy = await this.storage.getLegacyLocalReadStream(file.path);
      if (legacy) return legacy;
    }
    return this.storage.getReadStream(file.path);
  }

  private async deleteStoredFile(path: string | null): Promise<void> {
    if (!path || path.startsWith("http://") || path.startsWith("https://")) {
      return;
    }
    try {
      await this.storage.delete(path);
    } catch {
      /* ignore missing blob */
    }
    try {
      await this.storage.deleteLegacyLocal?.(path);
    } catch {
      /* ignore */
    }
  }
}
