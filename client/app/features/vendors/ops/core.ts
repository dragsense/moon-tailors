import type {
  TCreateVendorData,
  TCreateVendorPaymentData,
  TCreateVendorPurchaseData,
  TUpdateVendorData,
} from "@moon-tailors/contracts";
import {
  EPermissionAction,
  EResource,
  vendorListQuerySchema,
} from "@moon-tailors/contracts";
import { opT } from "~/locales";
import { formatAmount } from "~/lib/money";
import { invalidateQueriesKey, type OpConfig, type OpsBag } from "~/ops";
import { vendorsService } from "../api";
import { CreateVendorModal } from "../form/create-vendor-modal";
import { VendorPaymentModal } from "../form/vendor-payment-modal";
import { VendorPurchaseModal } from "../form/vendor-purchase-modal";
import { VendorDirectory } from "../list/vendor-directory";
import { vendorKeys } from "../query-keys";
import { VendorDetail } from "../view/vendor-detail";

export const refreshVendors = (_r: unknown, _v: unknown, _ops: OpsBag) => {
  invalidateQueriesKey(vendorKeys.list());
  invalidateQueriesKey(vendorKeys.detail());
};

/** Payment form vars: API body + vendor details shown in the confirm box. */
type VendorPaymentVars = TCreateVendorPaymentData & {
  id: string;
  vendorName: string;
  vendorCompany?: string;
  vendorPhone: string;
};

const updatePermission = {
  resource: EResource.VENDORS,
  action: EPermissionAction.UPDATE,
};

export const vendorOpsCore = {
  listVendors: {
    kind: "query" as const,
    permission: {
      resource: EResource.VENDORS,
      action: EPermissionAction.READ,
    },
    initialParams: { page: 1, limit: 20 },
    queryKey: vendorKeys.listWithParams,
    invalidateKey: vendorKeys.list(),
    fetch: (params: Record<string, unknown>) =>
      vendorsService.list(vendorListQuerySchema.parse(params)),
    component: VendorDirectory,
    auto: false,
    onError: (error: Error) => {
      console.error("[vendors.listVendors]", error.message);
    },
  },
  getVendor: {
    kind: "query" as const,
    permission: {
      resource: EResource.VENDORS,
      action: EPermissionAction.READ,
    },
    initialParams: { id: "" },
    queryKey: vendorKeys.detailWithParams,
    invalidateKey: vendorKeys.detail(),
    fetch: (params: Record<string, unknown>) => {
      const id = typeof params.id === "string" ? params.id : "";
      if (!id) return Promise.resolve(null);
      return vendorsService.getOne(id);
    },
    component: VendorDetail,
    auto: false,
    onError: (error: Error) => {
      console.error("[vendors.getVendor]", error.message);
    },
  },
  createVendor: {
    kind: "mutation" as const,
    permission: {
      resource: EResource.VENDORS,
      action: EPermissionAction.CREATE,
    },
    mutate: (body: unknown) =>
      vendorsService.create(body as TCreateVendorData),
    component: CreateVendorModal,
    auto: true,
    onSuccess: refreshVendors,
    onError: (error: Error) => {
      console.error("[vendors.createVendor]", error.message);
    },
  },
  updateVendor: {
    kind: "mutation" as const,
    permission: updatePermission,
    mutate: (vars: unknown) => {
      const { id, ...body } = vars as TUpdateVendorData & { id: string };
      return vendorsService.update(id, body);
    },
    onSuccess: refreshVendors,
    onError: (error: Error) => {
      console.error("[vendors.updateVendor]", error.message);
    },
  },
  /** Opened with the vendor as payload. */
  addVendorPurchase: {
    kind: "mutation" as const,
    permission: updatePermission,
    mutate: (vars: unknown) => {
      const { id, ...body } = vars as TCreateVendorPurchaseData & {
        id: string;
      };
      return vendorsService.addPurchase(id, body);
    },
    component: VendorPurchaseModal,
    auto: true,
    onSuccess: refreshVendors,
    onError: (error: Error) => {
      console.error("[vendors.addVendorPurchase]", error.message);
    },
  },
  /** Opened with the vendor as payload. */
  addVendorPayment: {
    kind: "mutation" as const,
    permission: updatePermission,
    /** Money leaves the shop — make the user confirm the vendor first. */
    confirm: {
      title: () => opT("vendors.confirmPaymentTitle"),
      description: (vars: unknown) => {
        const payment = vars as VendorPaymentVars;
        return opT("vendors.confirmPaymentDescription", {
          amount: formatAmount(payment.amount),
          name: payment.vendorName,
          company: payment.vendorCompany ? ` · ${payment.vendorCompany}` : "",
          phone: payment.vendorPhone,
        });
      },
      confirmLabel: () => opT("vendors.confirmPaymentLabel"),
      tone: "default" as const,
    },
    mutate: (vars: unknown) => {
      // Vendor details are only for the confirm box — not sent to the API.
      const { id, vendorName, vendorCompany, vendorPhone, ...body } =
        vars as VendorPaymentVars;
      return vendorsService.addPayment(id, body);
    },
    component: VendorPaymentModal,
    auto: true,
    onSuccess: refreshVendors,
    onError: (error: Error) => {
      console.error("[vendors.addVendorPayment]", error.message);
    },
  },
} satisfies Record<string, OpConfig>;

export type VendorOpsCore = typeof vendorOpsCore;
