import type {
  TCreateGarmentTypeData,
  TUpdateGarmentTypeData,
} from "@moon-tailors/contracts";
import {
  EGarmentAudience,
  EPermissionAction,
  EResource,
} from "@moon-tailors/contracts";
import {
  invalidateQueriesKey,
  refetchOp,
  type OpConfig,
  type OpsBag,
} from "~/ops";
import { garmentTypesService } from "../api";
import { GarmentTypeModal } from "../form/garment-type-modal";
import { GarmentTypeList } from "../list/garment-type-list";
import { garmentTypeKeys } from "../query-keys";

const onSuccess = (_r: unknown, _v: unknown, ops: OpsBag) => {
  refetchOp(ops, "listGarmentTypes");
  invalidateQueriesKey(garmentTypeKeys.all);
};

export const garmentTypeOpsCore = {
  listGarmentTypes: {
    kind: "query" as const,
    permission: {
      resource: EResource.GARMENT_TYPES,
      action: EPermissionAction.READ,
    },
    initialParams: { page: 1, limit: 100 },
    queryKey: garmentTypeKeys.list,
    invalidateKey: garmentTypeKeys.lists(),
    fetch: (params: Record<string, unknown>) =>
      garmentTypesService.list({
        page: Number(params.page ?? 1),
        limit: Number(params.limit ?? 100),
        audience:
          params.audience === EGarmentAudience.GENTS ||
          params.audience === EGarmentAudience.LADIES
            ? params.audience
            : undefined,
      }),
    component: GarmentTypeList,
    auto: false,
    onError: (error: Error) => {
      console.error("[garmentTypes.listGarmentTypes]", error.message);
    },
  },
  createGarmentType: {
    kind: "mutation" as const,
    permission: {
      resource: EResource.GARMENT_TYPES,
      action: EPermissionAction.CREATE,
    },
    mutate: (body: unknown) =>
      garmentTypesService.create(body as TCreateGarmentTypeData),
    component: GarmentTypeModal,
    auto: true,
    onSuccess,
    onError: (error: Error) => {
      console.error("[garmentTypes.createGarmentType]", error.message);
    },
  },
  updateGarmentType: {
    kind: "mutation" as const,
    permission: {
      resource: EResource.GARMENT_TYPES,
      action: EPermissionAction.UPDATE,
    },
    mutate: (vars: unknown) => {
      const { id, ...body } = vars as TUpdateGarmentTypeData & { id: string };
      return garmentTypesService.update(id, body);
    },
    component: GarmentTypeModal,
    auto: true,
    onSuccess,
    onError: (error: Error) => {
      console.error("[garmentTypes.updateGarmentType]", error.message);
    },
  },
  deleteGarmentType: {
    kind: "mutation" as const,
    permission: {
      resource: EResource.GARMENT_TYPES,
      action: EPermissionAction.DELETE,
    },
    confirm: {
      title: "Delete garment type",
      description: (vars: unknown) => {
        const v = vars as { name?: string };
        return v.name
          ? `Delete “${v.name}”? You can only delete types that are not used yet.`
          : "Delete this garment type?";
      },
      confirmLabel: "Delete",
      tone: "destructive" as const,
    },
    mutate: (vars: unknown) => {
      const { id } = vars as { id: string };
      return garmentTypesService.remove(id);
    },
    onSuccess,
    onError: (error: Error) => {
      console.error("[garmentTypes.deleteGarmentType]", error.message);
    },
  },
} satisfies Record<string, OpConfig>;

export type GarmentTypeOpsCore = typeof garmentTypeOpsCore;
