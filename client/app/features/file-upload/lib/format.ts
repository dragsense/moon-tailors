import { USER_UPLOAD_FOLDER } from "@template/contracts";

/** Human label for a storage folder slug. */
export function formatFileFolderLabel(folder: string): string {
  if (!folder || folder === USER_UPLOAD_FOLDER) return "General";
  return folder
    .split(/[-_/]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function formatFileSize(size: number): string {
  if (size >= 1024 * 1024) {
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  }
  if (size >= 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }
  return `${size} B`;
}
