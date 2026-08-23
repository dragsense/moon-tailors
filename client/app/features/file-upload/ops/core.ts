/**
 * File-upload ops catalog — list / folders / upload / update / view / delete.
 */
import type {
  TCreateFileUpload,
  TUpdateFileUpload,
} from "@template/contracts";
import {
  EFileType,
  EPermissionAction,
  EResource,
  USER_UPLOAD_FOLDER,
} from "@template/contracts";
import {
  invalidateQueriesKey,
  refetchOp,
  type OpConfig,
  type OpsBag,
} from "~/ops";
import {
  fileUploadService,
  type TCreateFileUploadBody,
  type TUpdateFileUploadBody,
} from "../api";
import { UploadFileModal, UpdateFileModal } from "../form";
import { FileList } from "../list";
import { fileKeys } from "../query-keys";
import { ViewFileModal } from "../view";

const onSuccess = (_r: unknown, _v: unknown, ops: OpsBag) => {
  refetchOp(ops, "listFiles");
  refetchOp(ops, "listFolders");
  invalidateQueriesKey(fileKeys.lists());
  invalidateQueriesKey(fileKeys.folders());
};

export const fileUploadOpsCore = {
  listFiles: {
    kind: "query" as const,
    permission: { resource: EResource.FILES, action: EPermissionAction.READ },
    initialParams: { page: 1, limit: 20, folder: USER_UPLOAD_FOLDER },
    queryKey: fileKeys.list,
    invalidateKey: fileKeys.lists(),
    fetch: (params: Record<string, unknown>) =>
      fileUploadService.list({
        page: Number(params.page ?? 1),
        limit: Number(params.limit ?? 20),
        search:
          typeof params.search === "string" ? params.search : undefined,
        folder:
          typeof params.folder === "string" ? params.folder : undefined,
        type:
          typeof params.type === "string"
            ? (params.type as EFileType)
            : undefined,
      }),
    component: FileList,
    auto: false,
    onError: (error: Error) => {
      console.error("[files.listFiles]", error.message);
    },
  },
  listFolders: {
    kind: "query" as const,
    permission: { resource: EResource.FILES, action: EPermissionAction.READ },
    queryKey: (_params: Record<string, unknown>) => fileKeys.folders(),
    invalidateKey: fileKeys.folders(),
    fetch: () => fileUploadService.listFolders(),
    auto: true,
    onError: (error: Error) => {
      console.error("[files.listFolders]", error.message);
    },
  },
  uploadFile: {
    kind: "mutation" as const,
    permission: {
      resource: EResource.FILES,
      action: EPermissionAction.CREATE,
    },
    mutate: (body: unknown) =>
      fileUploadService.create(body as TCreateFileUploadBody),
    component: UploadFileModal,
    auto: true,
    onSuccess,
    onError: (error: Error) => {
      console.error("[files.uploadFile]", error.message);
    },
  },
  viewFile: {
    kind: "mutation" as const,
    permission: { resource: EResource.FILES, action: EPermissionAction.READ },
    mutate: async (vars: unknown) => vars,
    component: ViewFileModal,
    auto: true,
  },
  updateFile: {
    kind: "mutation" as const,
    permission: {
      resource: EResource.FILES,
      action: EPermissionAction.UPDATE,
    },
    mutate: (vars: unknown) => {
      const { id, body } = vars as {
        id: string;
        body: TUpdateFileUploadBody;
      };
      return fileUploadService.update(id, body);
    },
    component: UpdateFileModal,
    auto: true,
    onSuccess,
    onError: (error: Error) => {
      console.error("[files.updateFile]", error.message);
    },
  },
  deleteFile: {
    kind: "mutation" as const,
    permission: {
      resource: EResource.FILES,
      action: EPermissionAction.DELETE,
    },
    confirm: {
      title: "Delete file",
      description: (vars: unknown) => {
        const v = vars as { name?: string };
        return v.name
          ? `Delete “${v.name}” permanently?`
          : "Delete this file permanently?";
      },
      confirmLabel: "Delete",
      tone: "destructive" as const,
    },
    mutate: (vars: unknown) => {
      const { id } = vars as { id: string };
      return fileUploadService.remove(id);
    },
    onSuccess,
    onError: (error: Error) => {
      console.error("[files.deleteFile]", error.message);
    },
  },
} satisfies Record<string, OpConfig>;

export type FileUploadOpsCore = typeof fileUploadOpsCore;
export type FileUploadOpName = keyof FileUploadOpsCore;

// Keep create/update types referenced for DX / tree-shaking clarity.
export type { TCreateFileUpload, TUpdateFileUpload };
