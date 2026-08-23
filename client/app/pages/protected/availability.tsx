import { UserAvailabilityPage } from "~/features/user-availability";
import type { Route } from "./+types/availability";

export function meta(_args: Route.MetaArgs) {
  return [{ title: "Availability · Template" }];
}

export default function AvailabilityRoute() {
  return <UserAvailabilityPage />;
}
