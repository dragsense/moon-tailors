import type {
  TCreateOrderData,
  TUpdateOrderData,
} from "@moon-tailors/contracts";
import {
  EPermissionAction,
  EResource,
  orderListQuerySchema,
} from "@moon-tailors/contracts";
import {
  invalidateQueriesKey,
  refetchOp,
  type OpConfig,
  type OpsBag,
} from "~/ops";
import { ordersService } from "../api";
import { CreateOrderModal } from "../form/create-order-modal";
import { OrderList } from "../list/order-list";
import { orderKeys } from "../query-keys";
import { ViewOrderModal } from "../view/view-order-modal";

export const refreshOrders = (_r: unknown, _v: unknown, ops: OpsBag) => {
  refetchOp(ops, "listOrders");
  refetchOp(ops, "getOrder");
  invalidateQueriesKey(orderKeys.list());
  invalidateQueriesKey(orderKeys.detail());
};

/** Prefixed op names so packs can compose with customers/measurements safely. */
export const orderOpsCore = {
  listOrders: {
    kind: "query" as const,
    permission: { resource: EResource.ORDERS, action: EPermissionAction.READ },
    initialParams: { page: 1, limit: 20 },
    queryKey: orderKeys.listWithParams,
    invalidateKey: orderKeys.list(),
    fetch: (params: Record<string, unknown>) =>
      ordersService.list(orderListQuerySchema.parse(params)),
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
    queryKey: orderKeys.detailWithParams,
    invalidateKey: orderKeys.detail(),
    fetch: (params: Record<string, unknown>) => {
      const id = typeof params.id === "string" ? params.id : "";
      if (!id) return Promise.resolve(null);
      return ordersService.getOne(id);
    },
    auto: false,
    onError: (error: Error) => {
      console.error("[orders.getOrder]", error.message);
    },
  },
  viewOrder: {
    kind: "mutation" as const,
    permission: { resource: EResource.ORDERS, action: EPermissionAction.READ },
    mutate: async (vars: unknown) => {
      const id =
        typeof vars === "string"
          ? vars
          : vars &&
              typeof vars === "object" &&
              "id" in vars &&
              typeof (vars as { id: unknown }).id === "string"
            ? (vars as { id: string }).id
            : "";
      if (!id) return null;
      return ordersService.getOne(id);
    },
    component: ViewOrderModal,
    auto: true,
    onError: (error: Error) => {
      console.error("[orders.viewOrder]", error.message);
    },
  },
  createOrder: {
    kind: "mutation" as const,
    permission: {
      resource: EResource.ORDERS,
      action: EPermissionAction.CREATE,
    },
    mutate: (body: unknown) => ordersService.create(body as TCreateOrderData),
    component: CreateOrderModal,
    auto: true,
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
} satisfies Record<string, OpConfig>;

export type OrderOpsCore = typeof orderOpsCore;
