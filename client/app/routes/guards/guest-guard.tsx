import { Navigate, Outlet } from "react-router";
import { LEVEL_HOME } from "~/config";
import { useSessionState } from "~/features/auth/hooks";
import { RouteLoading } from "./route-loading";

/** Guest-only routes — signed-in users redirect to their level home. */
export default function GuestGuard() {
  const { session, isLoading } = useSessionState();

  if (isLoading) {
    return <RouteLoading />;
  }

  if (session) {
    return <Navigate to={LEVEL_HOME[session.user.level]} replace />;
  }

  return <Outlet />;
}
