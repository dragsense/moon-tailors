import type {
  ICustomer,
  IPaginatedResponse,
  TCreateCustomerData,
  TCustomerListQuery,
  TMeasurementValues,
  TUpdateCustomerData,
} from "@moon-tailors/contracts";
import { BaseService } from "~/lib/api";

class CustomersService extends BaseService<
  ICustomer,
  TCreateCustomerData,
  TUpdateCustomerData
> {
  constructor() {
    super("/customers");
  }

  list(query: Partial<TCustomerListQuery> = {}) {
    const { page = 1, limit = 20, ...rest } = query;
    return this.get<ICustomer>({
      page,
      limit,
      ...rest,
    }) as Promise<IPaginatedResponse<ICustomer>>;
  }

  getOne(id: string) {
    return this.getSingle<ICustomer>(id);
  }

  create(body: TCreateCustomerData) {
    return this.post<ICustomer>(body);
  }

  update(id: string, body: TUpdateCustomerData) {
    return this.patch<ICustomer>(id)(body);
  }

  updateDefaultMeasurements(id: string, body: TMeasurementValues) {
    return this.patch<ICustomer>()(
      body as TUpdateCustomerData,
      undefined,
      `/${id}/default-measurements`,
    );
  }
}

export const customersService = new CustomersService();
