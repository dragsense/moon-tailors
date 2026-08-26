import { Navigate } from "react-router";
import { APP_ROUTES } from "~/config/routes.config";
import type { Route } from "./+types/detail";

export function meta(_args: Route.MetaArgs) {
  return [{ title: "Orders · Moon Tailors" }];
}

/** Order detail is a modal — old URLs redirect to the orders list. */
export default function OrderDetailRedirect() {
  return <Navigate to={APP_ROUTES.ORDERS} replace />;
}
