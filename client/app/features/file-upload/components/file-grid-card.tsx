import { useState } from "react";
import {
  Eye,
  ExternalLink,
  FileAudio,
  FileImage,
  FileQuestion,
  FileText,
  FileVideo,
  Trash2,
} from "lucide-react";
import {
  EFileType,
  isSystemFileFolder,
  type IFileUpload,
} from "@template/contracts";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";
import { formatFileSize } from "../lib/format";

export type FileGridCardProps = {
  item: IFileUpload;
  dateLabel?: string;
  onView?: (file: IFileUpload) => void;
  onDelete?: (file: IFileUpload) => void;
};

function getFileTypeIcon(type: EFileType | string) {
  switch (type) {
    case EFileType.IMAGE:
      return FileImage;
    case EFileType.DOCUMENT:
      return FileText;
    case EFileType.VIDEO:
      return FileVideo;
    case EFileType.AUDIO:
      return FileAudio;
    default:
      return FileQuestion;
  }
}

function openFileUrl(url?: string) {
  if (!url) return;
  window.open(url, "_blank", "noopener,noreferrer");
}

export function FileGridCard({
  item,
  dateLabel,
  onView,
  onDelete,
}: FileGridCardProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const canDelete = !isSystemFileFolder(item.folder) && !!onDelete;
  const isImage =
    item.type === EFileType.IMAGE || item.mimeType?.startsWith("image/");
  const showImage = isImage && !!item.url && !imageFailed;
  const TypeIcon = getFileTypeIcon(item.type);
  const hasUrl = Boolean(item.url);

  return (
    <div className="group flex h-full min-w-0 flex-col overflow-hidden rounded-lg border bg-background transition-colors hover:border-primary/40 hover:bg-muted/20">
      <button
        type="button"
        className="relative aspect-[4/3] w-full overflow-hidden bg-muted/40"
        onClick={() => (hasUrl ? openFileUrl(item.url) : onView?.(item))}
        title={item.name}
      >
        {showImage ? (
          <img
            src={item.url}
            alt={item.name}
            className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-[1.02]"
            loading="lazy"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-muted-foreground">
            <TypeIcon className="size-10" />
            <span className="max-w-[90%] truncate px-2 text-xs capitalize">
              {item.type}
            </span>
          </div>
        )}

        <div className="absolute start-2 top-2 flex max-w-[calc(100%-1rem)] gap-1">
          <Badge className="max-w-full truncate border-primary/25 bg-primary/10 text-[10px] capitalize text-primary backdrop-blur-sm">
            {item.type}
          </Badge>
          {isSystemFileFolder(item.folder) ? (
            <Badge className="shrink-0 border-primary/25 bg-primary/10 text-[10px] text-primary backdrop-blur-sm">
              System
            </Badge>
          ) : null}
        </div>
      </button>

      <div className="flex min-w-0 flex-1 flex-col gap-2 p-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium" title={item.name}>
            {item.name}
          </p>
          <p
            className="mt-0.5 truncate text-xs text-muted-foreground"
            title={item.mimeType}
          >
            {item.mimeType || "—"}
          </p>
        </div>

        <div className="mt-auto flex items-center justify-between gap-2 text-xs text-muted-foreground">
          <span className="shrink-0">{formatFileSize(item.size)}</span>
          {dateLabel ? (
            <span className="min-w-0 truncate">{dateLabel}</span>
          ) : null}
        </div>

        <div className="flex items-center gap-1 border-t pt-2">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-8"
            disabled={!hasUrl}
            onClick={() => openFileUrl(item.url)}
            title="Open file"
          >
            <ExternalLink className="size-3.5" />
          </Button>
          {onView ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-8"
              onClick={() => onView(item)}
              title="Details"
            >
              <Eye className="size-3.5" />
            </Button>
          ) : null}
          {onDelete ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className={cn("size-8", !canDelete && "opacity-40")}
              disabled={!canDelete}
              onClick={() => onDelete(item)}
              title={
                canDelete
                  ? "Delete"
                  : "System folder files cannot be deleted here"
              }
            >
              <Trash2
                className={cn(
                  "size-3.5",
                  canDelete ? "text-destructive" : "text-muted-foreground",
                )}
              />
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
