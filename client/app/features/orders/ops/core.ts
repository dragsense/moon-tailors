import type {
  TCreateOrderData,
  TReceiveOrderPaymentData,
  TUpdateOrderData,
} from "@moon-tailors/contracts";
import {
  EPermissionAction,
  EResource,
  getQuerySchema,
  orderListQuerySchema,
} from "@moon-tailors/contracts";
import { invalidateQueriesKey, type OpConfig, type OpsBag } from "~/ops";
import { opT } from "~/locales";
import { ordersService } from "../api";
import { CreateOrderModal } from "../form/create-order-modal";
import { ReceivePaymentModal } from "../form/receive-payment-modal";
import { OrderList } from "../list/order-list";
import { LatestOrders } from "../list/latest-orders";
import { orderKeys } from "../query-keys";
import { ViewOrderModal } from "../view/view-order-modal";

function orderIdFromPayload(payload: unknown): string {
  if (
    payload &&
    typeof payload === "object" &&
    "id" in payload &&
    typeof (payload as { id: unknown }).id === "string"
  ) {
    return (payload as { id: string }).id;
  }
  return "";
}

export const refreshOrders = (_r: unknown, _v: unknown, _ops: OpsBag) => {
  invalidateQueriesKey(orderKeys.list());
  invalidateQueriesKey(orderKeys.detail());
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
  latestOrders: {
    kind: "query" as const,
    permission: { resource: EResource.ORDERS, action: EPermissionAction.READ },
    initialParams: { page: 1, limit: 3, sortBy: "createdAt", sortOrder: "DESC" },
    queryKey: orderKeys.listWithParams,
    invalidateKey: orderKeys.list(),
    fetch: (params: Record<string, unknown>) =>
      ordersService.list(orderListQuerySchema.parse(params)),
    component: LatestOrders,
    auto: false,
    onError: (error: Error) => {
      console.error("[orders.latestOrders]", error.message);
    },
  },
  viewOrder: {
    kind: "query" as const,
    permission: { resource: EResource.ORDERS, action: EPermissionAction.READ },
    initialParams: { _relations: ["measurement"] },
    queryKey: (params: Record<string, unknown>, payload?: unknown) => {
      const id = orderIdFromPayload(payload);
      return [...orderKeys.detail(), id, params] as const;
    },
    invalidateKey: orderKeys.detail(),
    fetch: (params: Record<string, unknown>, payload?: unknown) => {
      const id = orderIdFromPayload(payload);
      if (!id) return Promise.resolve(null);
      const query = getQuerySchema.parse(params);
      return ordersService.getOne(id, query);
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
    confirm: forceEditConfirm,
    mutate: (vars: unknown) => {
      const { id, ...body } = vars as TUpdateOrderData & { id: string };
      return ordersService.update(id, body);
    },
    onSuccess: refreshOrders,
    onError: (error: Error) => {
      console.error("[orders.updateOrder]", error.message);
    },
  },
  /** Opened with the order as payload — money received from the customer. */
  receiveOrderPayment: {
    kind: "mutation" as const,
    permission: {
      resource: EResource.ORDERS,
      action: EPermissionAction.UPDATE,
    },
    mutate: (vars: unknown) => {
      const { id, ...body } = vars as TReceiveOrderPaymentData & { id: string };
      return ordersService.receivePayment(id, body);
    },
    component: ReceivePaymentModal,
    auto: true,
    onSuccess: refreshOrders,
    onError: (error: Error) => {
      console.error("[orders.receiveOrderPayment]", error.message);
    },
  },
} satisfies Record<string, OpConfig>;

export type OrderOpsCore = typeof orderOpsCore;
