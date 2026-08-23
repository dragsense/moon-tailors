import {
  Calendar,
  Copy,
  ExternalLink,
  Folder,
  HardDrive,
} from "lucide-react";
import {
  EFileType,
  isSystemFileFolder,
  type IFileUpload,
} from "@template/contracts";
import { Modal } from "~/components/layout-ui";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { useMaybeOp, type MutationOpComponentProps } from "~/ops";
import { formatFileFolderLabel, formatFileSize } from "../lib/format";

function fileFromPayload(payload: unknown): IFileUpload | null {
  if (payload && typeof payload === "object" && "id" in payload) {
    return payload as IFileUpload;
  }
  return null;
}

function openFileUrl(url?: string) {
  if (!url) return;
  window.open(url, "_blank", "noopener,noreferrer");
}

/** viewFile.component — read-only detail modal. */
export function ViewFileModal({
  isOpen,
  payload,
  close,
  store,
}: MutationOpComponentProps) {
  const updateFile = useMaybeOp(store, "updateFile");
  const deleteFile = useMaybeOp(store, "deleteFile");
  const file = fileFromPayload(payload);

  if (!isOpen || !file) return null;

  const canDelete = !isSystemFileFolder(file.folder);
  const isImage =
    file.type === EFileType.IMAGE || file.mimeType?.startsWith("image/");

  return (
    <Modal title="File details" description={file.name} onClose={close}>
      <div className="space-y-4">
        {isImage && file.url ? (
          <button
            type="button"
            className="block w-full overflow-hidden rounded-lg border"
            onClick={() => openFileUrl(file.url)}
          >
            <img
              src={file.url}
              alt={file.name}
              className="max-h-64 w-full object-contain bg-muted/30"
            />
          </button>
        ) : null}

        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary" className="capitalize">
            {file.type}
          </Badge>
          {isSystemFileFolder(file.folder) ? (
            <Badge variant="secondary">System</Badge>
          ) : null}
        </div>

        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div className="space-y-1">
            <dt className="flex items-center gap-1.5 text-muted-foreground">
              <Folder className="size-3.5" /> Folder
            </dt>
            <dd className="font-medium">
              {formatFileFolderLabel(file.folder)}
            </dd>
          </div>
          <div className="space-y-1">
            <dt className="flex items-center gap-1.5 text-muted-foreground">
              <HardDrive className="size-3.5" /> Size
            </dt>
            <dd className="font-medium">{formatFileSize(file.size)}</dd>
          </div>
          <div className="space-y-1 sm:col-span-2">
            <dt className="text-muted-foreground">MIME</dt>
            <dd className="font-medium break-all">{file.mimeType || "—"}</dd>
          </div>
          <div className="space-y-1 sm:col-span-2">
            <dt className="text-muted-foreground">Original name</dt>
            <dd className="font-medium break-all">{file.originalName}</dd>
          </div>
          <div className="space-y-1 sm:col-span-2">
            <dt className="flex items-center gap-1.5 text-muted-foreground">
              <Calendar className="size-3.5" /> Created
            </dt>
            <dd className="font-medium">
              {new Date(file.createdAt).toLocaleString()}
            </dd>
          </div>
        </dl>

        <div className="flex flex-wrap justify-end gap-2 border-t pt-4">
          {file.url ? (
            <>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(file.url);
                  } catch {
                    /* ignore */
                  }
                }}
              >
                <Copy className="size-3.5" />
                Copy URL
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => openFileUrl(file.url)}
              >
                <ExternalLink className="size-3.5" />
                Open
              </Button>
            </>
          ) : null}
          {updateFile?.kind === "mutation" && updateFile.allowed ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                close();
                updateFile.open(file);
              }}
            >
              Edit
            </Button>
          ) : null}
          {deleteFile?.kind === "mutation" &&
          deleteFile.allowed &&
          canDelete ? (
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={() => {
                void deleteFile
                  .run({ id: file.id, name: file.name })
                  .then(() => close())
                  .catch(() => {});
              }}
            >
              Delete
            </Button>
          ) : null}
          <Button type="button" onClick={close}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
}
