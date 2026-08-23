import type { z } from "zod";
import {
  fileFolderSummarySchema,
  fileUploadSchema,
  paginatedFileUploadsSchema,
} from "./schema.js";

export interface IFileUpload extends z.infer<typeof fileUploadSchema> {}
export interface IFileFolderSummary
  extends z.infer<typeof fileFolderSummarySchema> {}
export interface IPaginatedFileUploads
  extends z.infer<typeof paginatedFileUploadsSchema> {}
