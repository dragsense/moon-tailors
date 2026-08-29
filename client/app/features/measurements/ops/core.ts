import type { TUpdateMeasurementData } from "@moon-tailors/contracts";
import { EPermissionAction, EResource } from "@moon-tailors/contracts";
import { invalidateQueriesKey, type OpConfig, type OpsBag } from "~/ops";
import { opT } from "~/locales";
import { measurementsService } from "../api";
import { measurementKeys } from "../query-keys";
import { MeasurementView } from "../view/measurement-view";

export const refreshMeasurements = (
  _r: unknown,
  _v: unknown,
  _ops: OpsBag,
) => {
  invalidateQueriesKey(measurementKeys.detail());
};

const forceEditConfirm = {
  when: (vars: unknown) =>
    Boolean(
      vars &&
        typeof vars === "object" &&
        "forceEdit" in vars &&
        (vars as { forceEdit?: boolean }).forceEdit,
    ),
  title: () => opT("orders.forceEdit"),
  description: () => opT("orders.forceEditConfirm"),
  confirmLabel: () => opT("orders.forceEdit"),
  tone: "destructive" as const,
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
    confirm: forceEditConfirm,
    mutate: (vars: unknown) => {
      const { id, ...body } = vars as TUpdateMeasurementData & { id: string };
      return measurementsService.update(id, body);
    },
    onSuccess: refreshMeasurements,
    onError: (error: Error) => {
      console.error("[measurements.updateMeasurement]", error.message);
    },
  },
  addMeasurement: {
    kind: "mutation" as const,
    permission: {
      resource: EResource.MEASUREMENTS,
      action: EPermissionAction.UPDATE,
    },
    mutate: (vars: unknown) => {
      const { customerId, ...body } = vars as TUpdateMeasurementData & {
        customerId: string;
      };
      return measurementsService.addForCustomer(customerId, body);
    },
    onSuccess: refreshMeasurements,
    onError: (error: Error) => {
      console.error("[measurements.addMeasurement]", error.message);
    },
  },
  applyMeasurementsToDefault: {
    kind: "mutation" as const,
    permission: {
      resource: EResource.MEASUREMENTS,
      action: EPermissionAction.UPDATE,
    },
    confirm: {
      title: () => opT("orders.updateDefaults"),
      description: () => opT("orders.updateDefaultsConfirm"),
      confirmLabel: () => opT("orders.updateDefaults"),
      tone: "default" as const,
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
