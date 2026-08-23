import type { z } from "zod";
import {
  createFileUploadSchema,
  fileFolderSummarySchema,
  fileListQuerySchema,
  fileUploadSchema,
  paginatedFileUploadsSchema,
  updateFileUploadSchema,
} from "./schema.js";

export type TCreateFileUpload = z.infer<typeof createFileUploadSchema>;
export type TUpdateFileUpload = z.infer<typeof updateFileUploadSchema>;
export type TFileUpload = z.infer<typeof fileUploadSchema>;
export type TFileListQuery = z.infer<typeof fileListQuerySchema>;
export type TFileFolderSummary = z.infer<typeof fileFolderSummarySchema>;
export type TPaginatedFileUploads = z.infer<typeof paginatedFileUploadsSchema>;
