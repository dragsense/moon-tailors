import type {
  IUserAvailability,
  TUpsertUserAvailability,
} from "@template/contracts";
import { BaseService } from "~/lib/api";

class UserAvailabilityService extends BaseService<
  IUserAvailability,
  TUpsertUserAvailability,
  TUpsertUserAvailability
> {
  constructor() {
    super("/user-availability");
  }

  mine() {
    return this.getSingle<IUserAvailability>();
  }

  upsert(body: TUpsertUserAvailability) {
    return this.put<IUserAvailability>()(body);
  }
}

export const userAvailabilityService = new UserAvailabilityService();
