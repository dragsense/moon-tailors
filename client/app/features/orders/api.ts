import type {
  IOrder,
  IPaginatedResponse,
  TCreateOrderData,
  TOrderListQuery,
  TUpdateOrderData,
  TUpdateOrderMeasurementData,
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

  list(query: Partial<TOrderListQuery> = {}) {
    const { page = 1, limit = 20, ...rest } = query;
    return this.get<IOrder>({
      page,
      limit,
      ...rest,
    }) as Promise<IPaginatedResponse<IOrder>>;
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

  updateMeasurements(id: string, body: TUpdateOrderMeasurementData) {
    return this.patch<IOrder>()(
      body as TUpdateOrderData,
      undefined,
      `/${id}/measurements`,
    );
  }

  applyMeasurementsToDefault(id: string, garmentTypeId: string) {
    return this.post<IOrder>(
      { garmentTypeId } as unknown as TCreateOrderData,
      undefined,
      `/${id}/apply-measurements-to-default`,
    );
  }
}

export const ordersService = new OrdersService();
