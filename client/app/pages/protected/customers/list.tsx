import { Navigate } from "react-router";
import { APP_ROUTES } from "~/config/routes.config";

export function meta() {
  return [{ title: "Customers · Moon Tailors" }];
}

export default function CustomersPage() {
  return <Navigate to={APP_ROUTES.DASHBOARD} replace />;
}
