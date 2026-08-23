import { Link } from "react-router";
import { SurfaceCard } from "~/components/layout-ui";
import { Button } from "~/components/ui/button";
import { LEVEL_HOME, ROOT_ROUTE } from "~/config";
import { useSession } from "~/features/auth/hooks";

export function meta() {
  return [{ title: "Unauthorized · Template" }];
}

export default function UnauthorizedPage() {
  const session = useSession();
  const home = session ? LEVEL_HOME[session.user.level] : ROOT_ROUTE;

  return (
    <SurfaceCard
      className="mx-auto max-w-lg"
      title="Not allowed"
      description="Your account does not have access to this page."
    >
      <Button asChild>
        <Link to={home}>Back to app</Link>
      </Button>
    </SurfaceCard>
  );
}
