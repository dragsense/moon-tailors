import { Navigate, Outlet, useLocation } from "react-router";
import { PUBLIC_ROUTES } from "~/config";
import { useSessionState } from "~/features/auth/hooks";
import { RouteLoading } from "./route-loading";

/** Protected routes — guests redirect to login. */
export default function AuthGuard() {
  const { session, isLoading } = useSessionState();
  const location = useLocation();

  if (isLoading) {
    return <RouteLoading />;
  }

  if (!session) {
    return (
      <Navigate
        to={PUBLIC_ROUTES.LOGIN}
        replace
        state={{ from: location.pathname }}
      />
    );
  }

  return <Outlet />;
}
