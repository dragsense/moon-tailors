import type {
  TCreateOrderData,
  TUpdateOrderData,
  TUpdateOrderMeasurementData,
} from "@moon-tailors/contracts";
import { EPermissionAction, EResource } from "@moon-tailors/contracts";
import {
  invalidateQueriesKey,
  refetchOp,
  type OpConfig,
  type OpsBag,
} from "~/ops";
import { customerKeys } from "~/features/customers/query-keys";
import { ordersService } from "../api";
import { OrderList } from "../list/order-list";
import { orderKeys } from "../query-keys";
import { CreateOrderView } from "../view/create-order-view";
import { OrderDetail } from "../view/order-detail";

const refreshOrders = (_r: unknown, _v: unknown, ops: OpsBag) => {
  refetchOp(ops, "listOrders");
  refetchOp(ops, "getOrder");
  invalidateQueriesKey(orderKeys.lists());
  invalidateQueriesKey(orderKeys.details());
  invalidateQueriesKey(customerKeys.details());
};

export const orderOpsCore = {
  listOrders: {
    kind: "query" as const,
    permission: { resource: EResource.ORDERS, action: EPermissionAction.READ },
    initialParams: { page: 1, limit: 20 },
    queryKey: orderKeys.list,
    invalidateKey: orderKeys.lists(),
    fetch: (params: Record<string, unknown>) =>
      ordersService.list({
        page: Number(params.page ?? 1),
        limit: Number(params.limit ?? 20),
        search: typeof params.search === "string" ? params.search : undefined,
        status:
          typeof params.status === "string" ? params.status : undefined,
        customerId:
          typeof params.customerId === "string"
            ? params.customerId
            : undefined,
      } as never),
    component: OrderList,
    auto: false,
    onError: (error: Error) => {
      console.error("[orders.listOrders]", error.message);
    },
  },
  getOrder: {
    kind: "query" as const,
    permission: { resource: EResource.ORDERS, action: EPermissionAction.READ },
    initialParams: { id: "" },
    queryKey: orderKeys.detail,
    invalidateKey: orderKeys.details(),
    fetch: (params: Record<string, unknown>) => {
      const id = typeof params.id === "string" ? params.id : "";
      if (!id) return Promise.resolve(null);
      return ordersService.getOne(id);
    },
    component: OrderDetail,
    auto: false,
    onError: (error: Error) => {
      console.error("[orders.getOrder]", error.message);
    },
  },
  createOrderPage: {
    kind: "query" as const,
    permission: {
      resource: EResource.ORDERS,
      action: EPermissionAction.CREATE,
    },
    initialParams: {},
    queryKey: () => [...orderKeys.all, "new"] as const,
    invalidateKey: orderKeys.lists(),
    fetch: async () => null,
    component: CreateOrderView,
    auto: false,
  },
  createOrder: {
    kind: "mutation" as const,
    permission: {
      resource: EResource.ORDERS,
      action: EPermissionAction.CREATE,
    },
    mutate: (body: unknown) => ordersService.create(body as TCreateOrderData),
    auto: false,
    onSuccess: refreshOrders,
    onError: (error: Error) => {
      console.error("[orders.createOrder]", error.message);
    },
  },
  updateOrder: {
    kind: "mutation" as const,
    permission: {
      resource: EResource.ORDERS,
      action: EPermissionAction.UPDATE,
    },
    mutate: (vars: unknown) => {
      const { id, ...body } = vars as TUpdateOrderData & { id: string };
      return ordersService.update(id, body);
    },
    onSuccess: refreshOrders,
    onError: (error: Error) => {
      console.error("[orders.updateOrder]", error.message);
    },
  },
  updateOrderMeasurements: {
    kind: "mutation" as const,
    permission: {
      resource: EResource.MEASUREMENTS,
      action: EPermissionAction.UPDATE,
    },
    mutate: (vars: unknown) => {
      const { id, ...body } = vars as TUpdateOrderMeasurementData & {
        id: string;
      };
      return ordersService.updateMeasurements(id, body);
    },
    onSuccess: refreshOrders,
    onError: (error: Error) => {
      console.error("[orders.updateOrderMeasurements]", error.message);
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
      return ordersService.applyMeasurementsToDefault(id);
    },
    onSuccess: refreshOrders,
    onError: (error: Error) => {
      console.error("[orders.applyMeasurementsToDefault]", error.message);
    },
  },
} satisfies Record<string, OpConfig>;
