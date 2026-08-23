import type {
  IBilling,
  IMessageResponse,
  IPaginatedBillings,
  TCreateBilling,
  TBillingListQuery,
  TPayBilling,
  TUpdateBilling,
} from "@template/contracts";
import { BaseService } from "~/lib/api";

class BillingsService extends BaseService<
  IBilling,
  TCreateBilling,
  TUpdateBilling
> {
  constructor() {
    super("/billings");
  }

  list(query: Partial<TBillingListQuery> = {}) {
    const { page = 1, limit = 20, ...rest } = query;
    return this.get<IBilling>({ page, limit, ...rest }) as Promise<IPaginatedBillings>;
  }

  create(body: TCreateBilling) {
    return this.post<IMessageResponse>(body);
  }

  update(id: string, body: TUpdateBilling) {
    return this.patch<IMessageResponse>(id)(body);
  }

  pay(id: string, body: TPayBilling) {
    return this.post<IBilling>(body as unknown as TCreateBilling, undefined, `/${id}/pay`);
  }
}

export const billingsService = new BillingsService();
