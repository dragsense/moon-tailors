import type { IDashboardSummary } from "@template/contracts";
import { BaseService } from "~/lib/api";

class DashboardService extends BaseService<IDashboardSummary> {
  constructor() {
    super("/dashboard");
  }

  getSummary() {
    return this.getSingle<IDashboardSummary>();
  }
}

export const dashboardService = new DashboardService();
