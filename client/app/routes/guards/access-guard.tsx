import { Navigate, Outlet, useLocation } from "react-router";
import { COMMON_ROUTES, canAccessRoute } from "~/config";
import { useSession } from "~/features/auth/hooks";

/** Permission / level gate — runs after AuthGuard. */
export default function AccessGuard() {
  const session = useSession();
  const location = useLocation();

  if (!session) {
    return null;
  }

  if (!canAccessRoute(location.pathname, session.user)) {
    return <Navigate to={COMMON_ROUTES.UNAUTHORIZED} replace />;
  }

  return <Outlet />;
}
