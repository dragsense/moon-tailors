import { EPermissionAction, EResource } from "@moon-tailors/contracts";
import { dashboardService } from "../api";
import { dashboardKeys } from "../query-keys";
import { DashboardView } from "../view/dashboard-view";

export const dashboardOpsCore = {
  dashboardSummary: {
    kind: "query" as const,
    permission: {
      resource: EResource.DASHBOARD,
      action: EPermissionAction.READ,
    },
    queryKey: () => dashboardKeys.summary(),
    invalidateKey: dashboardKeys.summary(),
    fetch: () => dashboardService.getSummary(),
    component: DashboardView,
    auto: false,
    onError: (error: Error) => {
      console.error("[dashboard.summary]", error.message);
    },
  },
};
