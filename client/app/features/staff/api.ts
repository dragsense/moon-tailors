import type {
  IMessageResponse,
  IPaginatedResponse,
  IStaff,
  IStaffSlip,
  TCreateStaffData,
  TCreateStaffPaymentData,
  TGetQuery,
  TStaffListQuery,
  TStaffSlipQuery,
  TUpdateStaffData,
  TUpdateStaffPaymentData,
} from "@moon-tailors/contracts";
import { API_BASE_URL, BaseService } from "~/lib/api";

class StaffService extends BaseService<
  IStaff,
  TCreateStaffData,
  TUpdateStaffData
> {
  constructor() {
    super("/staff");
  }

  /** Page/limit/search come from the parsed list query (ops / schema). */
  list(query: TStaffListQuery) {
    return this.get<IPaginatedResponse<IStaff>>(query);
  }

  getOne(id: string, query: TGetQuery = {}) {
    return this.getSingle(id, query);
  }

  create(body: TCreateStaffData) {
    return this.post<IMessageResponse>(body);
  }

  update(id: string, body: TUpdateStaffData) {
    return this.patch<IMessageResponse>(id)(body);
  }

  /** POST /staff/:id/payments — uncapped. */
  addPayment(id: string, body: TCreateStaffPaymentData) {
    return this.post<IMessageResponse>(
      body as unknown as TUpdateStaffData,
      undefined,
      `/${id}/payments`,
    );
  }

  /** PATCH /staff/:id/payments/:paymentId */
  updatePayment(
    id: string,
    paymentId: string,
    body: TUpdateStaffPaymentData,
  ) {
    return this.patch<IMessageResponse>()(
      body as unknown as TUpdateStaffData,
      undefined,
      `/${id}/payments/${paymentId}`,
    );
  }

  /** GET /staff/:id/slip?month=YYYY-MM — single object, not a page. */
  slip(id: string, query: TStaffSlipQuery) {
    return this.getSingle<IStaffSlip>(undefined, query, `/${id}/slip`);
  }

  /** The printable slip page, opened in a new tab rather than fetched. */
  printUrl(id: string, month: string) {
    return `${API_BASE_URL}/staff/${id}/slip/print?month=${month}`;
  }
}

export const staffService = new StaffService();
