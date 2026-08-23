/**
 * Cameras ops catalog — CRUD + status + live stream player on list cards.
 */
import type { TCreateCamera, TUpdateCamera } from "@template/contracts";
import { EPermissionAction, EResource } from "@template/contracts";
import {
  invalidateQueriesKey,
  refetchOp,
  type OpsBag,
} from "~/ops";
import { camerasService } from "../api";
import {
  CreateCameraModal,
  UpdateCameraModal,
  UpdateCameraStatusModal,
} from "../form";
import { CameraList } from "../list/camera-list";
import { cameraKeys } from "../query-keys";
import { ViewCameraModal } from "../view/view-camera-modal";

const onSuccess = (_r: unknown, _v: unknown, ops: OpsBag) => {
  refetchOp(ops, "listCameras");
  invalidateQueriesKey(cameraKeys.lists());
};

export const camerasOpsCore = {
  listCameras: {
    kind: "query" as const,
    permission: {
      resource: EResource.VIDEO_STREAM,
      action: EPermissionAction.READ,
    },
    initialParams: { page: 1, limit: 12 },
    queryKey: cameraKeys.list,
    invalidateKey: cameraKeys.lists(),
    fetch: (params: Record<string, unknown>) =>
      camerasService.list({
        page: Number(params.page ?? 1),
        limit: Number(params.limit ?? 12),
        search:
          typeof params.search === "string" ? params.search : undefined,
        isActive:
          typeof params.isActive === "boolean"
            ? params.isActive
            : params.isActive === "true"
              ? true
              : params.isActive === "false"
                ? false
                : undefined,
      }),
    component: CameraList,
    auto: false,
    onError: (error: Error) => {
      console.error("[cameras.listCameras]", error.message);
    },
  },
  createCamera: {
    kind: "mutation" as const,
    permission: {
      resource: EResource.VIDEO_STREAM,
      action: EPermissionAction.CREATE,
    },
    mutate: (body: unknown) =>
      camerasService.create(body as TCreateCamera),
    component: CreateCameraModal,
    auto: true,
    onSuccess,
    onError: (error: Error) => {
      console.error("[cameras.createCamera]", error.message);
    },
  },
  viewCamera: {
    kind: "mutation" as const,
    permission: {
      resource: EResource.VIDEO_STREAM,
      action: EPermissionAction.READ,
    },
    mutate: async (vars: unknown) => vars,
    component: ViewCameraModal,
    auto: true,
  },
  updateCamera: {
    kind: "mutation" as const,
    permission: {
      resource: EResource.VIDEO_STREAM,
      action: EPermissionAction.UPDATE,
    },
    mutate: (vars: unknown) => {
      const { id, body } = vars as { id: string; body: TUpdateCamera };
      return camerasService.update(id, body);
    },
    component: UpdateCameraModal,
    auto: true,
    onSuccess,
    onError: (error: Error) => {
      console.error("[cameras.updateCamera]", error.message);
    },
  },
  updateCameraStatus: {
    kind: "mutation" as const,
    permission: {
      resource: EResource.VIDEO_STREAM,
      action: EPermissionAction.UPDATE,
    },
    mutate: (vars: unknown) => {
      const { id, isActive } = vars as { id: string; isActive: boolean };
      return camerasService.updateStatus(id, { isActive });
    },
    component: UpdateCameraStatusModal,
    auto: true,
    onSuccess,
    onError: (error: Error) => {
      console.error("[cameras.updateCameraStatus]", error.message);
    },
  },
  deleteCamera: {
    kind: "mutation" as const,
    permission: {
      resource: EResource.VIDEO_STREAM,
      action: EPermissionAction.DELETE,
    },
    mutate: (vars: unknown) => {
      const { id } = vars as { id: string };
      return camerasService.remove(id);
    },
    confirm: {
      title: "Delete camera?",
      description: "This removes the camera and its MediaMTX path.",
    },
    auto: true,
    onSuccess,
    onError: (error: Error) => {
      console.error("[cameras.deleteCamera]", error.message);
    },
  },
};
