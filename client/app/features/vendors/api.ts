import type {
  IMessageResponse,
  IPaginatedResponse,
  IVendor,
  TCreateVendorData,
  TCreateVendorPaymentData,
  TCreateVendorPurchaseData,
  TUpdateVendorData,
  TVendorListQuery,
} from "@moon-tailors/contracts";
import { BaseService } from "~/lib/api";

class VendorsService extends BaseService<
  IVendor,
  TCreateVendorData,
  TUpdateVendorData
> {
  constructor() {
    super("/vendors");
  }

  /** Page/limit/search come from the parsed list query (ops / schema). */
  list(query: TVendorListQuery) {
    return this.get<IPaginatedResponse<IVendor>>(query);
  }

  getOne(id: string) {
    return this.getSingle(id);
  }

  create(body: TCreateVendorData) {
    return this.post<IMessageResponse>(body);
  }

  update(id: string, body: TUpdateVendorData) {
    return this.patch<IMessageResponse>(id)(body);
  }

  /** POST /vendors/:id/purchases — body shape differs from create/update. */
  addPurchase(id: string, body: TCreateVendorPurchaseData) {
    return this.post<IMessageResponse>(
      body as unknown as TUpdateVendorData,
      undefined,
      `/${id}/purchases`,
    );
  }

  /** POST /vendors/:id/payments */
  addPayment(id: string, body: TCreateVendorPaymentData) {
    return this.post<IMessageResponse>(
      body as unknown as TUpdateVendorData,
      undefined,
      `/${id}/payments`,
    );
  }
}

export const vendorsService = new VendorsService();
