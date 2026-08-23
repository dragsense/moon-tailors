import { OpsProvider } from "~/ops";
import { taskCreateOps } from "~/features/tasks/ops/create";
import type { Route } from "./+types/new";

export function meta(_args: Route.MetaArgs) {
  return [{ title: "New task · Template" }];
}

/** createTask has auto: false → place via children (like listTasks). */
export default function NewTaskPage() {
  return (
    <OpsProvider store={taskCreateOps}>
      {({ components }) => components.createTask}
    </OpsProvider>
  );
}
