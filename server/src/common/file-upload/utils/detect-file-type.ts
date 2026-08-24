import { EFileType } from "@moon-tailors/contracts";

export function detectFileType(mimeType: string): EFileType {
  const mime = mimeType.toLowerCase();
  if (mime.startsWith("image/")) return EFileType.IMAGE;
  if (mime.startsWith("video/")) return EFileType.VIDEO;
  if (mime.startsWith("audio/")) return EFileType.AUDIO;
  if (
    mime.startsWith("application/pdf") ||
    mime.includes("document") ||
    mime.includes("msword") ||
    mime.includes("officedocument") ||
    mime.startsWith("text/")
  ) {
    return EFileType.DOCUMENT;
  }
  return EFileType.OTHER;
}
