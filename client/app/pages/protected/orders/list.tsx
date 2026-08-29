import { Navigate } from "react-router";
import { dashboardOrdersPath } from "~/config/routes.config";

export function meta() {
  return [{ title: "Orders · Moon Tailors" }];
}

/** Orders live in a dashboard modal — keep old URLs working. */
export default function OrdersPage() {
  return <Navigate to={dashboardOrdersPath()} replace />;
}
