import { Link } from "react-router";
import { Button } from "~/components/ui/button";
import { PUBLIC_ROUTES } from "~/config";
import { Page } from "~/layouts";

export default function NotFoundPage() {
  return (
    <Page
      title="Page not found"
      description="The page you requested does not exist."
    >
      <div className="flex flex-wrap gap-3">
        <Button asChild variant="default">
          <Link to={PUBLIC_ROUTES.LOGIN}>Go to login</Link>
        </Button>
      </div>
    </Page>
  );
}
