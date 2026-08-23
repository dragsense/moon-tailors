import {
 isSystemFileFolder,
 USER_UPLOAD_FOLDER,
 type IFileFolderSummary,
 type IPaginatedFileUploads,
} from "@template/contracts";
import { Alert, ListPagination } from "~/components/layout-ui";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { useI18n } from "~/hooks/use-i18n";
import { Page } from "~/layouts";
import { useOp, type QueryOpComponentProps } from "~/ops";
import { FileFolderSidebar, FileGridCard } from "../components";
import { formatFileFolderLabel } from "../lib/format";
import { FileFilters } from "./file-filters";

/**
 * listFiles.component — folder sidebar + grid (file manager layout).
 */
export function FileList({
 data,
 isPending,
 isError,
 error,
 store,
 params,
 setParams,
}: QueryOpComponentProps) {
 const { t } = useI18n();
 const listFolders = useOp(store, "listFolders");
 const uploadFile = useOp(store, "uploadFile");
 const viewFile = useOp(store, "viewFile");
 const deleteFile = useOp(store, "deleteFile");

 if (uploadFile.kind !== "mutation") return null;
 if (viewFile.kind !== "mutation") return null;
 if (deleteFile.kind !== "mutation") return null;

 const pageData = data as IPaginatedFileUploads | undefined;
 const files = pageData?.data ?? [];
 const meta = pageData;
 const selectedFolder =
 typeof params.folder === "string" && params.folder
 ? params.folder
 : USER_UPLOAD_FOLDER;
 const systemFolder = isSystemFileFolder(selectedFolder);
 const canUpload = uploadFile.allowed && !systemFolder;

 const folders: IFileFolderSummary[] =
 listFolders.kind === "query"
 ? ((listFolders.data as IFileFolderSummary[] | undefined) ?? [])
 : [];
 const foldersLoading =
 listFolders.kind === "query" ? listFolders.isPending : false;

 const errorMessage =
 isError && error instanceof Error
 ? error.message
 : isError
 ? "Failed to load files"
 : null;

 const selectFolder = (folder: string) => {
 setParams({
 ...params,
 page: 1,
 folder,
 });
 };

 return (
 <Page
 title={t("files.title")}
 description={t("files.description")}
 actions={
 canUpload ? (
 <Button
 type="button"
 onClick={ () => uploadFile.open({ folder: selectedFolder })}
 >
 {t("files.upload")}
 </Button>
) : null
 }
 >
 <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
 <FileFolderSidebar
 folders={folders}
 isLoading={foldersLoading}
 selectedFolder={selectedFolder}
 onSelectFolder={selectFolder}
 />

 <div className="min-w-0 flex-1 space-y-3">
 <div className="flex flex-wrap items-center gap-2">
 <h2 className="truncate text-base font-semibold">
 {formatFileFolderLabel(selectedFolder)}
 </h2>
 {systemFolder ? (
 <Badge variant="secondary">{t("files.systemFolder")}</Badge>
) : null}
 </div>

 {systemFolder ? (
 <p className="text-sm text-muted-foreground">
 {t("files.systemFolderDeleteBlocked")}
 </p>
) : null}

 <div className="flex flex-1 flex-wrap items-end justify-between gap-2">
 <FileFilters params={params} setParams={setParams} />
 {canUpload ? (
 <Button
 type="button"
 size="sm"
 onClick={ () => uploadFile.open({ folder: selectedFolder })}
 >
 {t("files.uploadShort")}
 </Button>
) : null}
 </div>

 {isPending ? (
 <p className="text-sm text-muted-foreground">
 {t("common.actions.loading")}
 </p>
) : null}

 {errorMessage ? (
 <Alert title="Couldn’t load files" tone="danger">
 {errorMessage}
 </Alert>
) : null}

 {!isPending && !errorMessage && files.length === 0 ? (
 <p className="text-sm text-muted-foreground">{t("files.empty")}</p>
) : null}

 {files.length > 0 ? (
 <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
 {files.map((file) => (
 <FileGridCard
 key={file.id}
 item={file}
 dateLabel={new Date(file.createdAt).toLocaleDateString()}
 onView={
 viewFile.allowed ? () => viewFile.open(file) : undefined
 }
 onDelete={
 deleteFile.allowed
 ? () => {
 void deleteFile
 .run({ id: file.id, name: file.name })
 .catch(() => {});
 }
 : undefined
 }
 />
))}
 </div>
) : null}

 {meta ? (
 <ListPagination
 meta={meta}
 pageItemCount={files.length}
 isLoading={isPending}
 mode="bar"
 onPageChange={(page) => setParams({ ...params, page })}
 onLimitChange={(limit) =>
 setParams({ ...params, page: 1, limit })
 }
 />
) : null}
 </div>
 </div>
 </Page>
);
}
