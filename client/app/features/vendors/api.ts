import type {
  IMessageResponse,
  IPaginatedResponse,
  IVendor,
  TCreateVendorData,
  TCreateVendorPaymentData,
  TCreateVendorPurchaseData,
  IVendorSlip,
  TUpdateVendorData,
  TVendorListQuery,
  TVendorSlipQuery,
} from "@moon-tailors/contracts";
import { API_BASE_URL, BaseService } from "~/lib/api";

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

  /** GET /vendors/:id/slip?month=YYYY-MM — single object, not a page. */
  slip(id: string, query: TVendorSlipQuery) {
    return this.getSingle<IVendorSlip>(undefined, query, `/${id}/slip`);
  }

  /** The printable statement, opened in a new tab rather than fetched. */
  printUrl(id: string, month: string) {
    return `${API_BASE_URL}/vendors/${id}/slip/print?month=${month}`;
  }
}

export const vendorsService = new VendorsService();
