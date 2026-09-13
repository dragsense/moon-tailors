import type {
  TCreateStaffData,
  TStaffLeaveData,
  TStaffRejoinData,
  TStaffSalaryData,
  TUpdateStaffData,
} from "@moon-tailors/contracts";
import {
  EPermissionAction,
  EResource,
  getQuerySchema,
  staffListQuerySchema,
} from "@moon-tailors/contracts";
import { invalidateQueriesKey, type OpConfig, type OpsBag } from "~/ops";
import { staffService } from "../api";
import { CreateStaffModal } from "../form/create-staff-modal";
import { StaffLeaveModal } from "../form/staff-leave-modal";
import { StaffRejoinModal } from "../form/staff-rejoin-modal";
import { StaffSalaryModal } from "../form/staff-salary-modal";
import { StaffDirectory } from "../list/staff-directory";
import { staffKeys } from "../query-keys";
import { StaffDetail } from "../view/staff-detail";

export const refreshStaff = (_r: unknown, _v: unknown, _ops: OpsBag) => {
  invalidateQueriesKey(staffKeys.list());
  invalidateQueriesKey(staffKeys.detail());
};

const updatePermission = {
  resource: EResource.STAFF,
  action: EPermissionAction.UPDATE,
};

export const staffOpsCore = {
  listStaff: {
    kind: "query" as const,
    permission: {
      resource: EResource.STAFF,
      action: EPermissionAction.READ,
    },
    initialParams: { page: 1, limit: 20 },
    queryKey: staffKeys.listWithParams,
    invalidateKey: staffKeys.list(),
    fetch: (params: Record<string, unknown>) =>
      staffService.list(staffListQuerySchema.parse(params)),
    component: StaffDirectory,
    auto: false,
    onError: (error: Error) => {
      console.error("[staff.listStaff]", error.message);
    },
  },
  getStaff: {
    kind: "query" as const,
    permission: {
      resource: EResource.STAFF,
      action: EPermissionAction.READ,
    },
    initialParams: { id: "" },
    queryKey: staffKeys.detailWithParams,
    invalidateKey: staffKeys.detail(),
    fetch: (params: Record<string, unknown>) => {
      const id = typeof params.id === "string" ? params.id : "";
      if (!id) return Promise.resolve(null);
      const query = getQuerySchema.parse(params);
      return staffService.getOne(id, query);
    },
    component: StaffDetail,
    auto: false,
    onError: (error: Error) => {
      console.error("[staff.getStaff]", error.message);
    },
  },
  createStaff: {
    kind: "mutation" as const,
    permission: {
      resource: EResource.STAFF,
      action: EPermissionAction.CREATE,
    },
    mutate: (body: unknown) => staffService.create(body as TCreateStaffData),
    component: CreateStaffModal,
    auto: true,
    onSuccess: refreshStaff,
    onError: (error: Error) => {
      console.error("[staff.createStaff]", error.message);
    },
  },
  updateStaff: {
    kind: "mutation" as const,
    permission: updatePermission,
    mutate: (vars: unknown) => {
      const { id, ...body } = vars as TUpdateStaffData & { id: string };
      return staffService.update(id, body);
    },
    onSuccess: refreshStaff,
    onError: (error: Error) => {
      console.error("[staff.updateStaff]", error.message);
    },
  },
  /** Opened with the staff member as payload. */
  changeStaffSalary: {
    kind: "mutation" as const,
    permission: updatePermission,
    mutate: (vars: unknown) => {
      const { id, ...body } = vars as TStaffSalaryData & { id: string };
      return staffService.changeSalary(id, body);
    },
    component: StaffSalaryModal,
    auto: true,
    onSuccess: refreshStaff,
    onError: (error: Error) => {
      console.error("[staff.changeStaffSalary]", error.message);
    },
  },
  /** Opened with the staff member as payload. */
  leaveStaff: {
    kind: "mutation" as const,
    permission: updatePermission,
    mutate: (vars: unknown) => {
      const { id, ...body } = vars as TStaffLeaveData & { id: string };
      return staffService.leave(id, body);
    },
    component: StaffLeaveModal,
    auto: true,
    onSuccess: refreshStaff,
    onError: (error: Error) => {
      console.error("[staff.leaveStaff]", error.message);
    },
  },
  /** Opened with the staff member as payload. */
  rejoinStaff: {
    kind: "mutation" as const,
    permission: updatePermission,
    mutate: (vars: unknown) => {
      const { id, ...body } = vars as TStaffRejoinData & { id: string };
      return staffService.rejoin(id, body);
    },
    component: StaffRejoinModal,
    auto: true,
    onSuccess: refreshStaff,
    onError: (error: Error) => {
      console.error("[staff.rejoinStaff]", error.message);
    },
  },
} satisfies Record<string, OpConfig>;

export type StaffOpsCore = typeof staffOpsCore;
