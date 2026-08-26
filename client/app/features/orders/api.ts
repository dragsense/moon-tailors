import type {
  IOrder,
  IPaginatedResponse,
  TCreateOrderData,
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
    return this.get<IOrder>(query) as Promise<IPaginatedResponse<IOrder>>;
  }

  getOne(id: string) {
    return this.getSingle<IOrder>(id);
  }

  create(body: TCreateOrderData) {
    return this.post<IOrder>(body);
  }

  update(id: string, body: TUpdateOrderData) {
    return this.patch<IOrder>(id)(body);
  }
}

export const ordersService = new OrdersService();
