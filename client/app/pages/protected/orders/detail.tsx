import { Navigate } from "react-router";
import { dashboardOrdersPath } from "~/config/routes.config";
import type { Route } from "./+types/detail";

export function meta(_args: Route.MetaArgs) {
  return [{ title: "Orders · Moon Tailors" }];
}

/** Order detail is a modal — old URLs open the dashboard orders list. */
export default function OrderDetailRedirect() {
  return <Navigate to={dashboardOrdersPath()} replace />;
}
