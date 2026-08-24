import { OpsProvider } from "~/ops";
import { dashboardPageOps } from "~/features/dashboard/ops/list";
import type { Route } from "./+types/dashboard";

export function meta(_args: Route.MetaArgs) {
  return [{ title: "Dashboard · Moon Tailors" }];
}

export default function DashboardPage() {
  return (
    <OpsProvider store={dashboardPageOps}>
      {({ components }) => components.dashboardSummary}
    </OpsProvider>
  );
}
