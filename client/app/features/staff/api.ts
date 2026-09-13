import type {
  IMessageResponse,
  IPaginatedResponse,
  IStaff,
  TCreateStaffData,
  TGetQuery,
  TStaffLeaveData,
  TStaffListQuery,
  TStaffRejoinData,
  TStaffSalaryData,
  TUpdateStaffData,
} from "@moon-tailors/contracts";
import { BaseService } from "~/lib/api";

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

  /** PATCH /staff/:id/salary — open work period only. */
  changeSalary(id: string, body: TStaffSalaryData) {
    return this.patch<IMessageResponse>()(
      body as unknown as TUpdateStaffData,
      undefined,
      `/${id}/salary`,
    );
  }

  /** POST /staff/:id/leave — body shape differs from create/update. */
  leave(id: string, body: TStaffLeaveData) {
    return this.post<IMessageResponse>(
      body as unknown as TUpdateStaffData,
      undefined,
      `/${id}/leave`,
    );
  }

  /** POST /staff/:id/rejoin */
  rejoin(id: string, body: TStaffRejoinData) {
    return this.post<IMessageResponse>(
      body as unknown as TUpdateStaffData,
      undefined,
      `/${id}/rejoin`,
    );
  }
}

export const staffService = new StaffService();
