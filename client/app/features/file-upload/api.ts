import type {
  IFileFolderSummary,
  IFileUpload,
  IMessageResponse,
  IPaginatedFileUploads,
  TCreateFileUpload,
  TFileListQuery,
  TUpdateFileUpload,
} from "@template/contracts";
import { BaseService } from "~/lib/api";

export type TCreateFileUploadBody = TCreateFileUpload & {
  file?: File | null;
};

export type TUpdateFileUploadBody = TUpdateFileUpload & {
  file?: File | null;
};

class FileUploadService extends BaseService<
  IFileUpload,
  TCreateFileUpload,
  TUpdateFileUpload
> {
  constructor() {
    super("/files");
  }

  list(query: Partial<TFileListQuery> = {}) {
    const { page = 1, limit = 20, ...rest } = query;
    return this.get<IFileUpload>({
      page,
      limit,
      ...rest,
    }) as Promise<IPaginatedFileUploads>;
  }

  listFolders() {
    return this.getAll<IFileFolderSummary>(undefined, "/folders");
  }

  getOne(id: string) {
    return this.getSingle(id);
  }

  create(body: TCreateFileUploadBody) {
    const { file, ...meta } = body;
    return this.postFormData<IMessageResponse>({
      ...meta,
      ...(file ? { file } : {}),
    });
  }

  update(id: string, body: TUpdateFileUploadBody) {
    const { file, ...meta } = body;
    return this.patchFormData<IMessageResponse>(id)({
      ...meta,
      ...(file ? { file } : {}),
    });
  }

  remove(id: string) {
    return this.delete(id) as Promise<IMessageResponse>;
  }

  download(id: string) {
    return this.downloadFileWithName(`/${id}/download`);
  }
}

export const fileUploadService = new FileUploadService();
