import type { ICamera, IPaginatedCameras } from "@template/contracts";
import { Alert, ListPagination } from "~/components/layout-ui";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { useI18n } from "~/hooks/use-i18n";
import { Page } from "~/layouts";
import { useOp, type QueryOpComponentProps } from "~/ops";
import { CameraPlayer } from "../player/camera-player";
import { CameraFilters } from "./camera-filters";

export function CameraList({
  data,
  isPending,
  isError,
  error,
  store,
  params,
  setParams,
}: QueryOpComponentProps) {
  const { t } = useI18n();
  const createCamera = useOp(store, "createCamera");
  const viewCamera = useOp(store, "viewCamera");
  const updateCamera = useOp(store, "updateCamera");
  const updateCameraStatus = useOp(store, "updateCameraStatus");
  const deleteCamera = useOp(store, "deleteCamera");

  if (createCamera.kind !== "mutation") return null;
  if (viewCamera.kind !== "mutation") return null;
  if (updateCamera.kind !== "mutation") return null;
  if (updateCameraStatus.kind !== "mutation") return null;
  if (deleteCamera.kind !== "mutation") return null;

  const pageData = data as IPaginatedCameras | undefined;
  const cameras = pageData?.data ?? [];
  const meta = pageData;
  const errorMessage =
    isError && error instanceof Error
      ? error.message
      : isError
        ? t("cameras.loadError")
        : null;

  return (
    <Page
      title={t("cameras.title")}
      description={t("cameras.description")}
      actions={
        createCamera.allowed ? (
          <Button type="button" onClick={() => createCamera.open()}>
            {t("cameras.add")}
          </Button>
        ) : null
      }
    >
      <div className="flex flex-col gap-4">
        <CameraFilters params={params} setParams={setParams} />

        {errorMessage ? (
          <Alert title={t("cameras.loadError")} tone="danger">
            {errorMessage}
          </Alert>
        ) : null}

        {isPending && !pageData ? (
          <p className="text-muted-foreground text-sm">{t("cameras.loading")}</p>
        ) : null}

        {!isPending && cameras.length === 0 ? (
          <p className="text-muted-foreground text-sm">{t("cameras.empty")}</p>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {cameras.map((camera) => (
            <CameraCard
              key={camera.id}
              camera={camera}
              onView={() => viewCamera.open(camera)}
              onEdit={
                updateCamera.allowed
                  ? () => updateCamera.open(camera)
                  : undefined
              }
              onToggleStatus={
                updateCameraStatus.allowed
                  ? () => updateCameraStatus.open(camera)
                  : undefined
              }
              onDelete={
                deleteCamera.allowed
                  ? () => {
                      void deleteCamera.run({ id: camera.id }).catch(() => {});
                    }
                  : undefined
              }
            />
          ))}
        </div>

        {meta ? (
          <ListPagination
            meta={meta}
            pageItemCount={cameras.length}
            isLoading={isPending}
            mode="bar"
            onPageChange={(page) => setParams({ ...params, page })}
            onLimitChange={(limit) =>
              setParams({ ...params, page: 1, limit })
            }
          />
        ) : null}
      </div>
    </Page>
  );
}

function CameraCard({
  camera,
  onView,
  onEdit,
  onToggleStatus,
  onDelete,
}: {
  camera: ICamera;
  onView: () => void;
  onEdit?: () => void;
  onToggleStatus?: () => void;
  onDelete?: () => void;
}) {
  const { t } = useI18n();

  return (
    <article className="flex flex-col gap-3 overflow-hidden rounded-xl border border-border/60 bg-card/30 p-3">
      {camera.isActive ? (
        <CameraPlayer camera={camera} className="aspect-video w-full" />
      ) : (
        <div className="bg-muted text-muted-foreground flex aspect-video items-center justify-center rounded-lg text-sm">
          {t("cameras.inactive")}
        </div>
      )}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="truncate font-medium">{camera.name}</h3>
          <p className="text-muted-foreground truncate text-xs">
            {camera.ipAddress ?? "—"}
            {camera.port != null ? `:${camera.port}` : ""}
          </p>
        </div>
        <Badge variant={camera.isActive ? "default" : "secondary"}>
          {camera.isActive ? t("cameras.active") : t("cameras.inactive")}
        </Badge>
      </div>
      <div className="flex flex-wrap gap-1.5">
        <Button type="button" size="sm" variant="outline" onClick={onView}>
          {t("cameras.view")}
        </Button>
        {onEdit ? (
          <Button type="button" size="sm" variant="outline" onClick={onEdit}>
            {t("cameras.edit")}
          </Button>
        ) : null}
        {onToggleStatus ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={onToggleStatus}
          >
            {camera.isActive ? t("cameras.deactivate") : t("cameras.activate")}
          </Button>
        ) : null}
        {onDelete ? (
          <Button
            type="button"
            size="sm"
            variant="destructive"
            onClick={onDelete}
          >
            {t("cameras.delete")}
          </Button>
        ) : null}
      </div>
    </article>
  );
}
