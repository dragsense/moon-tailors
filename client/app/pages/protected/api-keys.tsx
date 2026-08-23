import { ApiKeysPage } from "~/features/api-keys/api-keys-page";
import type { Route } from "./+types/api-keys";

export function meta(_args: Route.MetaArgs) {
  return [{ title: "API keys · Template" }];
}

export default function ApiKeysRoute() {
  return <ApiKeysPage />;
}
