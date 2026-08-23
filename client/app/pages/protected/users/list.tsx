import { OpsProvider } from "~/ops";
import { usersListOps } from "~/features/users/ops";
import type { Route } from "./+types/list";

export function meta(_args: Route.MetaArgs) {
  return [{ title: "Users · Template" }];
}

export default function UsersPage() {
  return (
    <OpsProvider store={usersListOps}>
      {({ components }) => components.listUsers}
    </OpsProvider>
  );
}
