import { Folder, FolderLock } from "lucide-react";
import type { IFileFolderSummary } from "@template/contracts";
import { Badge } from "~/components/ui/badge";
import { useI18n } from "~/hooks/use-i18n";
import { cn } from "~/lib/utils";
import { formatFileFolderLabel } from "../lib/format";

export type FileFolderSidebarProps = {
  folders: IFileFolderSummary[];
  isLoading?: boolean;
  selectedFolder: string;
  onSelectFolder: (folder: string) => void;
};

export function FileFolderSidebar({
  folders,
  isLoading,
  selectedFolder,
  onSelectFolder,
}: FileFolderSidebarProps) {
  const { t } = useI18n();

  return (
    <aside className="w-full shrink-0 rounded-lg border bg-card p-3 lg:w-64 xl:w-72">
      <div className="mb-3">
        <h2 className="text-sm font-semibold">{t("files.folders")}</h2>
        <p className="text-xs text-muted-foreground">{t("files.foldersHint")}</p>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">
          {t("common.actions.loading")}
        </p>
      ) : folders.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("common.status.empty")}</p>
      ) : (
        <div className="flex max-h-[70vh] flex-col gap-1 overflow-y-auto">
          {folders.map((folder) => {
            const selected = folder.folder === selectedFolder;
            const Icon = folder.isSystem ? FolderLock : Folder;

            return (
              <button
                key={folder.folder}
                type="button"
                onClick={() => onSelectFolder(folder.folder)}
                className={cn(
                  "flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-start transition-colors",
                  selected
                    ? "bg-primary/10 text-foreground"
                    : "hover:bg-muted/60",
                )}
              >
                <Icon className="size-4 shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="truncate text-sm font-medium">
                      {formatFileFolderLabel(folder.folder)}
                    </span>
                    {folder.isSystem ? (
                      <Badge
                        variant="secondary"
                        className="shrink-0 px-1.5 text-[10px]"
                      >
                        {t("files.systemFolder")}
                      </Badge>
                    ) : null}
                  </div>
                  <p className="truncate text-xs text-muted-foreground">
                    {folder.count}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </aside>
  );
}
