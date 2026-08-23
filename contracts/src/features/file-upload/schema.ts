import { z } from "zod";
import {
  createPaginatedSchema,
  listQuerySchema,
} from "../../common/schema.js";
import { field } from "../../lib/field-meta.js";
import { EFileType } from "./enum.js";

export const createFileUploadSchema = z.object({
  name: field(z.string().min(1).max(255).optional(), {
    type: "text",
    label: "Name",
    order: 1,
  }),
  folder: field(z.string().min(1).max(80).optional(), {
    type: "text",
    label: "Folder",
    placeholder: "general",
    order: 2,
  }),
  type: field(z.nativeEnum(EFileType).optional(), {
    type: "select",
    label: "Type",
    order: 3,
  }),
  /** External URL when no multipart file is sent. */
  url: field(z.string().url().optional(), {
    type: "text",
    label: "URL",
    order: 4,
  }),
});

export const updateFileUploadSchema = z.object({
  name: field(z.string().min(1).max(255).optional(), {
    type: "text",
    label: "Name",
    order: 1,
  }),
  type: field(z.nativeEnum(EFileType).optional(), {
    type: "select",
    label: "Type",
    order: 2,
  }),
});

export const fileUploadSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  originalName: z.string(),
  mimeType: z.string(),
  type: z.nativeEnum(EFileType),
  size: z.number().int().nonnegative(),
  folder: z.string(),
  path: z.string().nullable(),
  url: z.string(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const fileListQuerySchema = listQuerySchema.extend({
  type: field(z.nativeEnum(EFileType).optional(), {
    type: "select",
    label: "Type",
    placeholder: "All types",
    order: 2,
    filter: "eq",
    options: [
      { label: "Any", value: "__any__" },
      { label: "Image", value: EFileType.IMAGE },
      { label: "Document", value: EFileType.DOCUMENT },
      { label: "Video", value: EFileType.VIDEO },
      { label: "Audio", value: EFileType.AUDIO },
      { label: "Other", value: EFileType.OTHER },
    ],
  }),
  folder: field(z.string().optional(), {
    type: "hidden",
    order: 3,
    filter: "eq",
  }),
});

export const fileFolderSummarySchema = z.object({
  folder: z.string(),
  count: z.number().int().nonnegative(),
  isSystem: z.boolean(),
});

/** GET /files response. */
export const paginatedFileUploadsSchema =
  createPaginatedSchema(fileUploadSchema);
