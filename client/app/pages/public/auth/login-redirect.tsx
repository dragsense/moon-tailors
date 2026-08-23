import { Navigate } from "react-router";
import { ROOT_ROUTE } from "~/config";

/** Legacy `/login` → canonical login at `/`. */
export default function LoginRedirect() {
  return <Navigate to={ROOT_ROUTE} replace />;
}
