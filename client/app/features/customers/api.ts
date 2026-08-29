import type {
  ICustomer,
  IMessageResponse,
  IPaginatedResponse,
  TCreateCustomerData,
  TCustomerListQuery,
  TGetQuery,
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

  /** Page/limit/search come from the parsed list query (ops / schema). */
  list(query: TCustomerListQuery) {
    return this.get<IPaginatedResponse<ICustomer>>(query);
  }

  getOne(id: string, query: TGetQuery = {}) {
    return this.getSingle(id, query);
  }

  create(body: TCreateCustomerData) {
    return this.post<IMessageResponse>(body);
  }

  update(id: string, body: TUpdateCustomerData) {
    return this.patch<IMessageResponse>(id)(body);
  }
}

export const customersService = new CustomersService();
