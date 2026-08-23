/** Where uploaded bytes are stored. */
export enum EStorageDriver {
  LOCAL = "local",
  S3 = "s3",
}

/** High-level file category (auto-detected from MIME when uploading). */
export enum EFileType {
  IMAGE = "image",
  DOCUMENT = "document",
  VIDEO = "video",
  AUDIO = "audio",
  OTHER = "other",
}

/** Default folder for user uploads in the file manager. */
export const USER_UPLOAD_FOLDER = "general";

/** Folders managed by the app — blocked from file-manager deletes. */
export const SYSTEM_FILE_FOLDERS = [
  "avatars",
  "themes",
  "products",
  "system",
] as const;

export function isSystemFileFolder(folder: string | null | undefined): boolean {
  if (!folder) return false;
  return (SYSTEM_FILE_FOLDERS as readonly string[]).includes(folder);
}
