import type {
  IMessageResponse,
  IOrder,
  IPaginatedResponse,
  TCreateOrderData,
  TGetQuery,
  TOrderListQuery,
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
}

export const ordersService = new OrdersService();
