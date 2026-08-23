import { OpsProvider } from "~/ops";
import { tasksListOps } from "~/features/tasks/ops/list";
import type { Route } from "./+types/list";

export function meta(_args: Route.MetaArgs) {
  return [{ title: "Tasks · Template" }];
}

export default function TasksPage() {
  return (
    <OpsProvider store={tasksListOps}>
      {({ components }) => components.listTasks}
    </OpsProvider>
  );
}
