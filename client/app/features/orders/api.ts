import type {
  IMessageResponse,
  IOrder,
  IPaginatedResponse,
  TCreateOrderData,
  TGetQuery,
  TOrderListQuery,
  TReceiveOrderPaymentData,
  TUpdateOrderData,
} from "@moon-tailors/contracts";
import { BaseService } from "~/lib/api";

class OrdersService extends BaseService<
  IOrder,
  TCreateOrderData,
  TUpdateOrderData
> {
  constructor() {
    super("/orders");
  }

  /** Page/limit/filters come from the parsed list query (ops / schema). */
  list(query: TOrderListQuery) {
    return this.get<IPaginatedResponse<IOrder>>(query);
  }

  getOne(id: string, query: TGetQuery = {}) {
    return this.getSingle(id, query);
  }

  create(body: TCreateOrderData) {
    return this.post<IMessageResponse>(body);
  }

  update(id: string, body: TUpdateOrderData) {
    return this.patch<IMessageResponse>(id)(body);
  }

  /** POST /orders/:id/receive-payment — adds to the paid amount. */
  receivePayment(id: string, body: TReceiveOrderPaymentData) {
    return this.post<IOrder>(
      body as unknown as TUpdateOrderData,
      undefined,
      `/${id}/receive-payment`,
    );
  }
}

export const ordersService = new OrdersService();
