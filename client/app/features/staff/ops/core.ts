import type {
  TCreateStaffData,
  TCreateStaffPaymentData,
  TUpdateStaffData,
} from "@moon-tailors/contracts";
import {
  EPermissionAction,
  EResource,
  getQuerySchema,
  staffListQuerySchema,
  staffSlipQuerySchema,
} from "@moon-tailors/contracts";
import { formatAmount } from "~/lib/money";
import { opT } from "~/locales";
import { invalidateQueriesKey, type OpConfig, type OpsBag } from "~/ops";
import { staffService } from "../api";
import { CreateStaffModal } from "../form/create-staff-modal";
import { StaffPaymentModal } from "../form/staff-payment-modal";
import { StaffDirectory } from "../list/staff-directory";
import { staffKeys } from "../query-keys";
import { StaffDetail } from "../view/staff-detail";

export const refreshStaff = (_r: unknown, _v: unknown, _ops: OpsBag) => {
  invalidateQueriesKey(staffKeys.list());
  invalidateQueriesKey(staffKeys.detail());
  invalidateQueriesKey(staffKeys.slip());
};

/** Payment form vars: API body + staff details shown in the confirm box. */
type StaffPaymentVars = TCreateStaffPaymentData & {
  id: string;
  staffName: string;
  staffRole?: string;
  staffPhone: string;
};

const updatePermission = {
  resource: EResource.STAFF,
  action: EPermissionAction.UPDATE,
};

const readPermission = {
  resource: EResource.STAFF,
  action: EPermissionAction.READ,
};

export const staffOpsCore = {
  listStaff: {
    kind: "query" as const,
    permission: readPermission,
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
    permission: readPermission,
    initialParams: { id: "" },
    queryKey: staffKeys.detailWithParams,
    invalidateKey: staffKeys.detail(),
    fetch: (params: Record<string, unknown>) => {
      const id = typeof params.id === "string" ? params.id : "";
      if (!id) return Promise.resolve(null);
      return staffService.getOne(id, getQuerySchema.parse(params));
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
  /** Opened with the staff member as payload. Amount is never capped. */
  addStaffPayment: {
    kind: "mutation" as const,
    permission: updatePermission,
    /** Money leaves the shop — make the user confirm the person first. */
    confirm: {
      title: () => opT("staff.confirmPaymentTitle"),
      description: (vars: unknown) => {
        const payment = vars as StaffPaymentVars;
        return opT("staff.confirmPaymentDescription", {
          amount: formatAmount(payment.amount),
          name: payment.staffName,
          role: payment.staffRole ? ` · ${payment.staffRole}` : "",
          phone: payment.staffPhone,
        });
      },
      confirmLabel: () => opT("staff.confirmPaymentLabel"),
      tone: "default" as const,
    },
    mutate: (vars: unknown) => {
      // Staff details are only for the confirm box — not sent to the API.
      const { id, staffName, staffRole, staffPhone, ...body } =
        vars as StaffPaymentVars;
      return staffService.addPayment(id, body);
    },
    component: StaffPaymentModal,
    auto: true,
    onSuccess: refreshStaff,
    onError: (error: Error) => {
      console.error("[staff.addStaffPayment]", error.message);
    },
  },
  /** Opened with `{ staff, payment }`. No confirm — nothing leaves the shop. */
  editStaffPayment: {
    kind: "mutation" as const,
    permission: updatePermission,
    mutate: (vars: unknown) => {
      const { id, paymentId, staffName, staffRole, staffPhone, ...body } =
        vars as StaffPaymentVars & { paymentId: string };
      return staffService.updatePayment(id, paymentId, body);
    },
    component: StaffPaymentModal,
    auto: true,
    onSuccess: refreshStaff,
    onError: (error: Error) => {
      console.error("[staff.editStaffPayment]", error.message);
    },
  },
  /** Params are set by the slip panel; idle until both id and month are set. */
  getStaffSlip: {
    kind: "query" as const,
    permission: readPermission,
    initialParams: { id: "", month: "" },
    queryKey: staffKeys.slipWithParams,
    invalidateKey: staffKeys.slip(),
    fetch: (params: Record<string, unknown>) => {
      const id = typeof params.id === "string" ? params.id : "";
      const month = typeof params.month === "string" ? params.month : "";
      if (!id || !month) return Promise.resolve(null);
      return staffService.slip(id, staffSlipQuerySchema.parse({ month }));
    },
    auto: false,
    onError: (error: Error) => {
      console.error("[staff.getStaffSlip]", error.message);
    },
  },
} satisfies Record<string, OpConfig>;

export type StaffOpsCore = typeof staffOpsCore;
