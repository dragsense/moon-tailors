import type {
  TCreateCustomerData,
  TMeasurementValues,
  TUpdateCustomerData,
} from "@moon-tailors/contracts";
import { EPermissionAction, EResource } from "@moon-tailors/contracts";
import {
  invalidateQueriesKey,
  refetchOp,
  type OpConfig,
  type OpsBag,
} from "~/ops";
import { customersService } from "../api";
import { CreateCustomerModal } from "../form/create-customer-modal";
import { CustomerList } from "../list/customer-list";
import { customerKeys } from "../query-keys";
import { CustomerDetail } from "../view/customer-detail";
import { ordersService } from "~/features/orders/api";
import { orderKeys } from "~/features/orders/query-keys";

const refreshCustomers = (_r: unknown, _v: unknown, ops: OpsBag) => {
  refetchOp(ops, "listCustomers");
  refetchOp(ops, "getCustomer");
  invalidateQueriesKey(customerKeys.lists());
  invalidateQueriesKey(customerKeys.details());
};

export const customerOpsCore = {
  listCustomers: {
    kind: "query" as const,
    permission: {
      resource: EResource.CUSTOMERS,
      action: EPermissionAction.READ,
    },
    initialParams: { page: 1, limit: 20 },
    queryKey: customerKeys.list,
    invalidateKey: customerKeys.lists(),
    fetch: (params: Record<string, unknown>) =>
      customersService.list({
        page: Number(params.page ?? 1),
        limit: Number(params.limit ?? 20),
        search: typeof params.search === "string" ? params.search : undefined,
      }),
    component: CustomerList,
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
    queryKey: customerKeys.detail,
    invalidateKey: customerKeys.details(),
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
  listCustomerOrders: {
    kind: "query" as const,
    permission: { resource: EResource.ORDERS, action: EPermissionAction.READ },
    initialParams: { page: 1, limit: 20, customerId: "" },
    queryKey: orderKeys.list,
    invalidateKey: orderKeys.lists(),
    fetch: (params: Record<string, unknown>) => {
      const customerId =
        typeof params.customerId === "string" ? params.customerId : "";
      if (!customerId) {
        return Promise.resolve({
          data: [],
          page: 1,
          limit: 20,
          total: 0,
          lastPage: 1,
          hasNextPage: false,
          hasPrevPage: false,
        });
      }
      return ordersService.list({
        page: Number(params.page ?? 1),
        limit: Number(params.limit ?? 20),
        customerId,
      });
    },
    auto: false,
    onError: (error: Error) => {
      console.error("[customers.listCustomerOrders]", error.message);
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
  updateDefaultMeasurements: {
    kind: "mutation" as const,
    permission: {
      resource: EResource.MEASUREMENTS,
      action: EPermissionAction.UPDATE,
    },
    mutate: (vars: unknown) => {
      const { id, ...body } = vars as TMeasurementValues & { id: string };
      return customersService.updateDefaultMeasurements(id, body);
    },
    onSuccess: refreshCustomers,
    onError: (error: Error) => {
      console.error("[customers.updateDefaultMeasurements]", error.message);
    },
  },
} satisfies Record<string, OpConfig>;

export type CustomerOpsCore = typeof customerOpsCore;
