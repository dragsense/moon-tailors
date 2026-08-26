import type {
  TCreateCustomerData,
  TUpdateCustomerData,
} from "@moon-tailors/contracts";
import {
  customerListQuerySchema,
  EPermissionAction,
  EResource,
} from "@moon-tailors/contracts";
import {
  invalidateQueriesKey,
  refetchOp,
  type OpConfig,
  type OpsBag,
} from "~/ops";
import { customersService } from "../api";
import { CreateCustomerModal } from "../form/create-customer-modal";
import { CustomerDirectory } from "../list/customer-directory";
import { customerKeys } from "../query-keys";
import { CustomerDetail } from "../view/customer-detail";

export const refreshCustomers = (_r: unknown, _v: unknown, ops: OpsBag) => {
  refetchOp(ops, "listCustomers");
  refetchOp(ops, "getCustomer");
  invalidateQueriesKey(customerKeys.list());
  invalidateQueriesKey(customerKeys.detail());
};

/** Prefixed op names so packs can compose with orders/measurements safely. */
export const customerOpsCore = {
  listCustomers: {
    kind: "query" as const,
    permission: {
      resource: EResource.CUSTOMERS,
      action: EPermissionAction.READ,
    },
    initialParams: { page: 1, limit: 20 },
    queryKey: customerKeys.listWithParams,
    invalidateKey: customerKeys.list(),
    fetch: (params: Record<string, unknown>) =>
      customersService.list(customerListQuerySchema.parse(params)),
    component: CustomerDirectory,
    auto: false,
    onError: (error: Error) => {
      console.error("[customers.listCustomers]", error.message);
    },
  },
  getCustomer: {
    kind: "query" as const,
    permission: {
      resource: EResource.CUSTOMERS,
      action: EPermissionAction.READ,
    },
    initialParams: { id: "" },
    queryKey: customerKeys.detailWithParams,
    invalidateKey: customerKeys.detail(),
    fetch: (params: Record<string, unknown>) => {
      const id = typeof params.id === "string" ? params.id : "";
      if (!id) return Promise.resolve(null);
      return customersService.getOne(id);
    },
    component: CustomerDetail,
    auto: false,
    onError: (error: Error) => {
      console.error("[customers.getCustomer]", error.message);
    },
  },
  createCustomer: {
    kind: "mutation" as const,
    permission: {
      resource: EResource.CUSTOMERS,
      action: EPermissionAction.CREATE,
    },
    mutate: (body: unknown) =>
      customersService.create(body as TCreateCustomerData),
    component: CreateCustomerModal,
    auto: true,
    onSuccess: refreshCustomers,
    onError: (error: Error) => {
      console.error("[customers.createCustomer]", error.message);
    },
  },
  updateCustomer: {
    kind: "mutation" as const,
    permission: {
      resource: EResource.CUSTOMERS,
      action: EPermissionAction.UPDATE,
    },
    mutate: (vars: unknown) => {
      const { id, ...body } = vars as TUpdateCustomerData & { id: string };
      return customersService.update(id, body);
    },
    onSuccess: refreshCustomers,
    onError: (error: Error) => {
      console.error("[customers.updateCustomer]", error.message);
    },
  },
} satisfies Record<string, OpConfig>;

export type CustomerOpsCore = typeof customerOpsCore;
