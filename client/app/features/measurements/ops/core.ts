import type {
  TMeasurementValues,
  TUpdateMeasurementData,
} from "@moon-tailors/contracts";
import { EPermissionAction, EResource } from "@moon-tailors/contracts";
import {
  invalidateQueriesKey,
  refetchOp,
  type OpConfig,
  type OpsBag,
} from "~/ops";
import { measurementsService } from "../api";
import { measurementKeys } from "../query-keys";
import { MeasurementView } from "../view/measurement-view";

export const refreshMeasurements = (
  _r: unknown,
  _v: unknown,
  ops: OpsBag,
) => {
  refetchOp(ops, "getMeasurement");
  invalidateQueriesKey(measurementKeys.detail());
};

/**
 * Measurement catalog — host packs pickOps + patch onSuccess
 * to also refresh customers/orders.
 */
export const measurementOpsCore = {
  getMeasurement: {
    kind: "query" as const,
    permission: {
      resource: EResource.MEASUREMENTS,
      action: EPermissionAction.READ,
    },
    initialParams: { id: "" },
    queryKey: measurementKeys.detailWithParams,
    invalidateKey: measurementKeys.detail(),
    fetch: (params: Record<string, unknown>) => {
      const id = typeof params.id === "string" ? params.id : "";
      if (!id) return Promise.resolve(null);
      return measurementsService.getOne(id);
    },
    component: MeasurementView,
    auto: false,
    onError: (error: Error) => {
      console.error("[measurements.getMeasurement]", error.message);
    },
  },
  updateMeasurement: {
    kind: "mutation" as const,
    permission: {
      resource: EResource.MEASUREMENTS,
      action: EPermissionAction.UPDATE,
    },
    mutate: (vars: unknown) => {
      const { id, measurementId, ...body } = vars as TUpdateMeasurementData & {
        id?: string;
        measurementId?: string;
      };
      const mid = measurementId ?? id;
      if (!mid) return Promise.reject(new Error("measurement id required"));
      return measurementsService.update(mid, body);
    },
    onSuccess: refreshMeasurements,
    onError: (error: Error) => {
      console.error("[measurements.updateMeasurement]", error.message);
    },
  },
  updateDefaultMeasurements: {
    kind: "mutation" as const,
    permission: {
      resource: EResource.MEASUREMENTS,
      action: EPermissionAction.UPDATE,
    },
    mutate: (vars: unknown) => {
      const { id, measurementId, ...body } = vars as TMeasurementValues & {
        id: string;
        measurementId?: string;
      };
      if (measurementId) {
        return measurementsService.update(measurementId, body);
      }
      return measurementsService.upsertByCustomer(id, body);
    },
    onSuccess: refreshMeasurements,
    onError: (error: Error) => {
      console.error("[measurements.updateDefaultMeasurements]", error.message);
    },
  },
  applyMeasurementsToDefault: {
    kind: "mutation" as const,
    permission: {
      resource: EResource.MEASUREMENTS,
      action: EPermissionAction.UPDATE,
    },
    mutate: (vars: unknown) => {
      const { id } = vars as { id: string };
      return measurementsService.applyOrderToDefault(id);
    },
    onSuccess: refreshMeasurements,
    onError: (error: Error) => {
      console.error("[measurements.applyMeasurementsToDefault]", error.message);
    },
  },
} satisfies Record<string, OpConfig>;

export type MeasurementOpsCore = typeof measurementOpsCore;
